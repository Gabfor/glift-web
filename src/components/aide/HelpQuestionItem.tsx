"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AccordionItem, AccordionContent } from "@/components/ui/accordion";
import AccordionTrigger from "@/components/account/AccordionTrigger";
import Tooltip from "@/components/Tooltip";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

type Props = {
    questionId: string;
    question: string;
    answer: string;
};

export default function HelpQuestionItem({ questionId, question, answer }: Props) {
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCasted, setVoteCasted] = useState<'top' | 'flop' | null>(null);

    // Load persisted vote from localStorage
    useEffect(() => {
        const storedVote = localStorage.getItem(`glift_help_vote_${questionId}`);
        if (storedVote === 'top' || storedVote === 'flop') {
            setHasVoted(true);
            setVoteCasted(storedVote);
        }
    }, [questionId]);

    const handleVote = async (voteType: 'top' | 'flop') => {
        let action = 'add';

        if (hasVoted) {
            if (voteCasted === voteType) {
                action = 'remove';
                setHasVoted(false);
                setVoteCasted(null);
                localStorage.removeItem(`glift_help_vote_${questionId}`);
            } else {
                action = 'switch';
                setVoteCasted(voteType);
                localStorage.setItem(`glift_help_vote_${questionId}`, voteType);
            }
        } else {
            setHasVoted(true);
            setVoteCasted(voteType);
            localStorage.setItem(`glift_help_vote_${questionId}`, voteType);
        }

        try {
            await fetch('/api/help/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questionId, voteType, action }),
            });
        } catch (e) {
            console.error("Failed to cast vote", e);
        }
    };



    const cleanAnswer = answer
        // Collapse multiple empty paragraphs (with or without align styles) into a single empty paragraph
        .replace(/(<p(?:\s+style="text-align:\s*(?:left|center|right);?")?><\/p>\s*)+/g, '<p></p>');

    return (
        <AccordionItem value={questionId} id={questionId}>
            <style jsx global>{`
                .prose p.image-caption {
                    color: #D7D4DC !important;
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    text-align: center !important;
                    margin-top: 8px !important;
                    margin-bottom: 0px !important;
                    width: 100%;
                    display: block;
                }
                .prose img {
                    margin-top: 0px !important;
                    margin-bottom: 0px !important;
                    border-radius: 8px;
                    max-width: 100% !important;
                    height: auto !important;
                }
            `}</style>
            <div className="border border-[#D7D4DC] bg-white rounded-[8px]">
                <div className="overflow-hidden rounded-[8px]">
                    <AccordionTrigger>{question}</AccordionTrigger>
                </div>
                <AccordionContent
                    className="bg-white border-t border-[#D7D4DC] rounded-b-[8px]"
                >
                    <div className="px-[30px] pt-[20px] pb-[15px]">
                        {/* Answer Content */}
                        <div
                            className={`prose prose-sm max-w-none text-[14px] leading-[22px] font-semibold text-[#5D6494] mb-[25px] whitespace-pre-wrap ${quicksand.className}`}
                            dangerouslySetInnerHTML={{ __html: cleanAnswer }}
                        />

                        {/* Vote Section */}
                        <div className="flex items-center justify-center rounded-[8px] h-[20px] px-[20px]">
                            <span className="text-[14px] font-semibold text-[#C2BFC6] mr-[15px]">
                                Est-ce que cette réponse a été utile ?
                            </span>
                            <div className="flex items-center gap-[5px]">
                                {/* Top Vote */}
                                <Tooltip content="Oui">
                                    <button
                                        onClick={() => handleVote('top')}
                                        className="group w-[24px] h-[24px] flex items-center justify-center transition-all opacity-100"
                                        aria-label="Oui, utile"
                                    >
                                        <div className="relative w-[20px] h-[20px]">
                                            {!hasVoted || voteCasted !== 'top' ? (
                                                <Image
                                                    src="/icons/oui_gris.svg"
                                                    alt="Oui gris"
                                                    fill
                                                    className={`object-contain transition-opacity duration-200 ${!hasVoted ? 'group-hover:opacity-0' : ''
                                                        }`}
                                                />
                                            ) : null}
                                            {(!hasVoted || voteCasted === 'top') ? (
                                                <Image
                                                    src="/icons/oui_vert.svg"
                                                    alt="Oui vert"
                                                    fill
                                                    className={`object-contain absolute top-0 left-0 transition-opacity duration-200 ${!hasVoted ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                                                        }`}
                                                />
                                            ) : null}
                                        </div>
                                    </button>
                                </Tooltip>

                                {/* Flop Vote */}
                                <Tooltip content="Non">
                                    <button
                                        onClick={() => handleVote('flop')}
                                        className="group w-[24px] h-[24px] flex items-center justify-center transition-all opacity-100"
                                        aria-label="Non, pas utile"
                                    >
                                        <div className="relative w-[20px] h-[20px]">
                                            {!hasVoted || voteCasted !== 'flop' ? (
                                                <Image
                                                    src="/icons/non_gris.svg"
                                                    alt="Non gris"
                                                    fill
                                                    className={`object-contain transition-opacity duration-200 ${!hasVoted ? 'group-hover:opacity-0' : ''
                                                        }`}
                                                />
                                            ) : null}
                                            {(!hasVoted || voteCasted === 'flop') ? (
                                                <Image
                                                    src="/icons/non_rouge.svg"
                                                    alt="Non rouge"
                                                    fill
                                                    className={`object-contain absolute top-0 left-0 transition-opacity duration-200 ${!hasVoted ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                                                        }`}
                                                />
                                            ) : null}
                                        </div>
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </div>
        </AccordionItem>
    );
}
