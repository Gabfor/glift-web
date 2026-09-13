"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import { EmailField } from "@/components/forms/EmailField";
import FileUploader from "@/components/forms/FileUploader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ModalMessage from "@/components/ui/ModalMessage";
import Turnstile, { TurnstileRef } from "@/components/ui/Turnstile";
import { useUser } from "@/context/UserContext";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";

type ContactClientProps = {
    initialPageContent: {
        surtitre: string;
        titre: string;
        description: string;
        description_aide?: string;
    };
    fromAideInitial?: boolean;
};

function ContactForm({ initialPageContent, fromAideInitial = false }: ContactClientProps) {
    const router = useRouter();
    const { user } = useUser();
    const { helpUrl } = useDashboardUrl();
    const searchParams = useSearchParams();
    const fromAide = fromAideInitial || searchParams.get("from") === "aide";

    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [fileUrls, setFileUrls] = useState<string[]>([]);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileRef = useRef<TurnstileRef>(null);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const messageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === "success" || status === "error") {
            const timer = setTimeout(() => {
                if (messageRef.current) {
                    const yOffset = -140; // Décalage pour le header sticky
                    const y = messageRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
                } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user?.email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, subject, description, fileUrls, turnstileToken }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Une erreur est survenue lors de l'envoi du message.");
            }

            setStatus("success");
            if (!user?.email) {
                setEmail("");
            }
            setSubject("");
            setDescription("");
            setFileUrls([]);
            setTurnstileToken(null);
            turnstileRef.current?.reset();
        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMessage(err.message);
            turnstileRef.current?.reset();
        }
    };

    const isFormValid = email.trim() !== "" && subject.trim() !== "" && description.trim() !== "";

    const handleDescriptionClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = (e.target as HTMLElement).closest("a");
        if (target) {
            const href = target.getAttribute("href");
            if (href) {
                try {
                    const url = new URL(href, window.location.origin);
                    if (url.origin === window.location.origin) {
                        e.preventDefault();
                        router.push(url.pathname + url.search + url.hash);
                        return;
                    }
                } catch {
                    // ignore
                }
                if (href.startsWith("/") || href.startsWith("#")) {
                    e.preventDefault();
                    router.push(href);
                }
            }
        }
    };

    return (
        <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[100px] md:pt-[140px] pb-[80px] md:pb-[100px]">
            <div className="max-w-[1152px] w-full mx-auto flex flex-col items-center">
                {initialPageContent.surtitre && (
                    <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
                        {initialPageContent.surtitre}
                    </div>
                )}
                
                <h1 
                    className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
                    dangerouslySetInnerHTML={{ __html: initialPageContent.titre || "Nous contacter" }}
                />
                
                <div 
                    onClick={handleDescriptionClick}
                    className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8 [&_p]:m-0 [&_a]:text-[#7069FA] [&_a]:hover:text-[#6660E4] [&_a]:hover:no-underline [&_a]:transition-colors"
                >
                    {fromAide ? (
                        <div dangerouslySetInnerHTML={{ 
                            __html: (initialPageContent.description_aide || `Tu n'as pas trouvé la réponse à ta question dans notre <a href="{{helpUrl}}">Aide</a> ?<br />Pose ta question ci-dessous et nous reviendrons vers toi rapidement.`)
                                .replace(/target="_blank"/g, 'target="_self"')
                                .replaceAll("{{helpUrl}}", helpUrl)
                        }} />
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: initialPageContent.description || "Tu souhaites nous contacter ? Remplis le formulaire ci-dessous<br />et nous reviendrons vers toi rapidement." }} />
                    )}
                </div>

                {/* Form Container */}
                <form
                    className="flex flex-col w-full max-w-[564px]"
                    onSubmit={handleSubmit}
                >
                    {(status === "error" || status === "success") && (
                        <div ref={messageRef} className="w-full mb-[20px] scroll-mt-[140px]">
                            {status === "error" && (
                                <ErrorMessage
                                    title="Erreur d'envoi"
                                    description={errorMessage || "Oups, nous n’avons pas réussi à envoyer ton message. Merci de réessayer plus tard."}
                                />
                            )}
                            {status === "success" && (
                                <ModalMessage
                                    variant="success"
                                    title="Message envoyé"
                                    description="Merci, ton message a bien été envoyé ! Nous reviendrons vers toi rapidement."
                                />
                            )}
                        </div>
                    )}

                    {/* Email Field */}
                    <EmailField
                        id="contact-email"
                        name="email"
                        label="Email"
                        value={email}
                        onChange={setEmail}
                        placeholder="john.doe@gmail.com"
                        hideSuccessMessage
                        showExternalErrorWhenEmpty={false}
                        containerClassName="w-full"
                        messageContainerClassName="mt-2 text-[13px] font-medium"
                    />

                    {/* Subject Field */}
                    <div className="w-full">
                        <label htmlFor="subject" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                            Sujet
                        </label>
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Sujet de votre demande"
                            className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                        />
                        <div className="min-h-[20px] mt-2 text-[13px] font-medium"></div>
                    </div>

                    {/* Description Field */}
                    <div className="w-full">
                        <label htmlFor="description" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description de votre demande"
                            className="min-h-[160px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] p-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD] resize-y"
                        />
                        <div className="min-h-[20px] mt-2 text-[13px] font-medium"></div>
                    </div>

                    {/* Attachments Field */}
                    <div className="w-full mb-[30px]">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                            Pièces jointes
                        </label>
                        <FileUploader value={fileUrls} onChange={setFileUrls} />
                    </div>

                    {/* Turnstile invisible captcha */}
                    <Turnstile
                        ref={turnstileRef}
                        onVerify={setTurnstileToken}
                        onExpire={() => setTurnstileToken(null)}
                        className="hidden"
                    />

                    {/* Submit Button */}
                    <div className="w-full flex justify-center">
                        <CTAButton
                            type="submit"
                            className="font-semibold px-[30px] w-full sm:w-auto"
                            disabled={!isFormValid || status === "loading" || status === "success"}
                            loading={status === "loading"}
                            loadingText="Envoi en cours..."
                        >
                            Envoyer
                        </CTAButton>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default function ContactClient({ initialPageContent, fromAideInitial = false }: ContactClientProps) {
    const { helpUrl } = useDashboardUrl();
    const activeDescriptionAide = (initialPageContent.description_aide || `Tu n'as pas trouvé la réponse à ta question dans notre <a href="{{helpUrl}}">Aide</a> ?<br />Pose ta question ci-dessous et nous reviendrons vers toi rapidement.`)
        .replace(/target="_blank"/g, 'target="_self"')
        .replaceAll("{{helpUrl}}", helpUrl);
    const activeDefaultDescription = initialPageContent.description || "Tu souhaites nous contacter ? Remplis le formulaire ci-dessous<br />et nous reviendrons vers toi rapidement.";

    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[100px] md:pt-[140px] pb-[80px] md:pb-[100px]">
                <div className="max-w-[1152px] w-full mx-auto flex flex-col items-center">
                    {initialPageContent.surtitre && (
                        <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
                            {initialPageContent.surtitre}
                        </div>
                    )}
                    
                    <h1 
                        className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
                        dangerouslySetInnerHTML={{ __html: initialPageContent.titre || "Nous contacter" }}
                    />
                    
                    <div className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8 [&_p]:m-0 [&_a]:text-[#7069FA] [&_a]:hover:text-[#6660E4] [&_a]:hover:no-underline [&_a]:transition-colors">
                        <div dangerouslySetInnerHTML={{ __html: fromAideInitial ? activeDescriptionAide : activeDefaultDescription }} />
                    </div>
                </div>
            </main>
        }>
            <ContactForm initialPageContent={initialPageContent} fromAideInitial={fromAideInitial} />
        </Suspense>
    );
}
