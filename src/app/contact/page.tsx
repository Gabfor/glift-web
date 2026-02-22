"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import { EmailField } from "@/components/forms/EmailField";
import FileUploader from "@/components/forms/FileUploader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useUser } from "@/context/UserContext";

function ContactForm() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const fromAide = searchParams.get("from") === "aide";

    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [fileUrls, setFileUrls] = useState<string[]>([]);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

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
                body: JSON.stringify({ email, subject, description, fileUrls }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Une erreur est survenue lors de l'envoi du message.");
            }

            setStatus("success");
            // Optionally clear the form:
            setEmail(user?.email || "");
            setSubject("");
            setDescription("");
            setFileUrls([]);
        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMessage(err.message);
        }
    };

    const isFormValid = email.trim() !== "" && subject.trim() !== "" && description.trim() !== "";

    return (
        <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
            <div className="w-full flex flex-col items-center px-4 sm:px-0">

                <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[20px]">
                    Contactez-nous
                </h1>
                <p className="text-center text-[#5D6494] text-[16px] font-semibold max-w-[564px] mb-[40px]">
                    {fromAide ? (
                        <>
                            Vous n&apos;avez pas trouvé la réponse à votre question dans notre <Link href="/aide" className="text-[#7069FA] hover:text-[#6660E4] hover:no-underline transition-colors">Aide</Link> ?<br />
                            Posez votre question ci-dessous et nous reviendrons vers vous.
                        </>
                    ) : (
                        <>
                            Vous souhaitez nous contacter ? Remplissez le formulaire ci-dessous<br />
                            et nous reviendrons vers vous rapidement.
                        </>
                    )}
                </p>

                {/* Form Container */}
                <form
                    className="flex flex-col w-full max-w-[564px]"
                    onSubmit={handleSubmit}
                >
                    {status === "error" && (
                        <div className="w-full mb-[20px]">
                            <ErrorMessage
                                title="Erreur d'envoi"
                                description="Oups, nous n’avons pas réussi à envoyer le message. Merci de réessayer plus tard."
                            />
                        </div>
                    )}

                    {status === "success" && (
                        <div
                            className="w-full mb-[20px] max-w-[564px] px-4 py-3 text-left border-l-[3px] rounded-tr-[5px] rounded-br-[5px]"
                            style={{ backgroundColor: "#EAF5EA", borderLeftColor: "#59A95C" }}
                        >
                            <div className="text-[12px] font-bold" style={{ color: "#2B7E30" }}>
                                Message envoyé
                            </div>
                            <div className="text-[12px] font-semibold mt-1" style={{ color: "#59A95C" }}>
                                Merci, votre message a bien été envoyé ! Nous reviendrons vers vous rapidement.
                            </div>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="w-full mb-[10px]">
                        <EmailField
                            id="contact-email"
                            name="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="john.doe@gmail.com"
                            hideSuccessMessage
                            showExternalErrorWhenEmpty={false}
                            messageContainerClassName="h-[20px] mt-[5px]"
                        />
                    </div>

                    {/* Subject Field */}
                    <div className="w-full mb-[10px]">
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
                        <div className="h-[20px] mt-[5px]"></div>
                    </div>

                    {/* Description Field */}
                    <div className="w-full mb-[10px]">
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
                        <div className="h-[20px] mt-[5px]"></div>
                    </div>

                    {/* Attachments Field */}
                    <div className="w-full mb-[30px]">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                            Pièces jointes
                        </label>
                        <FileUploader value={fileUrls} onChange={setFileUrls} />
                    </div>

                    {/* Submit Button */}
                    <div className="w-full flex justify-center">
                        <CTAButton
                            type="submit"
                            className="font-semibold px-[30px]"
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

export default function ContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FBFCFE]" />}>
            <ContactForm />
        </Suspense>
    );
}
