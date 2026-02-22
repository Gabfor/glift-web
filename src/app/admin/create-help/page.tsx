"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import AdminMultiSelectDropdown from "@/components/AdminMultiSelectDropdown";
import RichTextEditor from "@/components/ui/RichTextEditor";
import CTAButton from "@/components/CTAButton";

function CreateHelpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const helpId = searchParams?.get("id");
    const isEditing = !!helpId;

    const supabase = useMemo(() => createClient(), []);

    const [categories, setCategories] = useState<string[]>([]);
    const [status, setStatus] = useState("ON");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!helpId) return;

        const fetchHelp = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("help_questions")
                .select("*")
                .eq("id", helpId)
                .single();

            if (data && !error) {
                const item = data as any;
                setQuestion(item.question);
                setAnswer(item.answer);
                setCategories(item.categories || []);
                setStatus(item.status);
            } else if (error) {
                console.error("Error fetching help item:", error);
            }
            setLoading(false);
        };

        void fetchHelp();
    }, [helpId, supabase]);

    const isFormValid = useMemo(
        () =>
            categories.length > 0 &&
            status.trim() !== "" &&
            question.trim() !== "" &&
            answer.trim() !== "" && answer !== "<p></p>",
        [categories, status, question, answer]
    );

    const inputClass =
        "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";

    const handleSave = async () => {
        if (!isFormValid || loading) return;

        setLoading(true);

        const payload = {
            question,
            answer,
            categories,
            status,
        };

        let resultError = null;

        if (isEditing) {
            const { error } = await (supabase.from("help_questions") as any)
                .update(payload)
                .eq("id", helpId);
            resultError = error;
        } else {
            const { error } = await (supabase.from("help_questions") as any)
                .insert([{ ...payload, top: 0, flop: 0 }]);
            resultError = error;
        }

        if (resultError) {
            console.error("Erreur lors de la sauvegarde :", resultError);
            alert(`Erreur : ${resultError.message}`);
            setLoading(false);
            return;
        }

        setLoading(false);
        router.push("/admin/help");
    };

    return (
        <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
            <div className="w-full max-w-3xl px-4 sm:px-0">
                <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
                    {isEditing ? "Modifier l'aide" : "Créer une aide"}
                </h2>

                <div className="flex flex-col gap-[30px]">
                    {/* Row 1: Catégories & Statut */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                        {/* Catégories */}
                        <div className="flex flex-col">
                            <label className="text-[#3A416F] font-bold mb-[5px]">Catégories</label>
                            <AdminMultiSelectDropdown
                                label=""
                                placeholder="Sélectionnez les catégories"
                                selected={categories}
                                onChange={setCategories}
                                options={[
                                    { value: "Programmes", label: "Programmes" },
                                    { value: "Store", label: "Store" },
                                    { value: "Shop", label: "Shop" },
                                    { value: "Blog", label: "Blog" },
                                    { value: "Abonnement", label: "Abonnement" },
                                    { value: "Application", label: "Application" },
                                ]}
                            />
                        </div>

                        {/* Statut */}
                        <div className="flex flex-col">
                            <label className="text-[#3A416F] font-bold mb-[5px]">Statut</label>
                            <AdminDropdown
                                label=""
                                placeholder="Sélectionnez le statut"
                                selected={status}
                                onSelect={(value) => setStatus(value)}
                                options={[
                                    { value: "ON", label: "ON" },
                                    { value: "OFF", label: "OFF" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Row 2: Question */}
                    <div className="flex flex-col">
                        <div className="flex justify-between mb-[5px]">
                            <span className="text-[16px] text-[#3A416F] font-bold">Question</span>
                            <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                                {question.length}/120
                            </span>
                        </div>
                        <input
                            type="text"
                            maxLength={120}
                            placeholder="Question de l'aide"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Row 3: Réponse */}
                    <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Réponse</label>
                        <RichTextEditor
                            value={answer}
                            onChange={setAnswer}
                        />
                    </div>

                    {/* BOUTON */}
                    <div className="mt-10 flex justify-center">
                        <CTAButton
                            onClick={handleSave}
                            disabled={!isFormValid || loading}
                            variant={isFormValid && !loading ? "active" : "inactive"}
                            className="font-semibold"
                        >
                            {loading
                                ? (isEditing ? "Mise à jour..." : "Création...")
                                : (isEditing ? "Mettre à jour" : "Créer la question")}
                        </CTAButton>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function CreateHelpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px]" />}>
            <CreateHelpForm />
        </Suspense>
    );
}
