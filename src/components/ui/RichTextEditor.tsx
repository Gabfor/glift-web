import { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { createClient } from "@/lib/supabaseClient";
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Image from '@tiptap/extension-image';
import {
    MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough,
    MdFormatListBulleted, MdFormatListNumbered, MdLink, MdLinkOff, MdOndemandVideo, MdImage,
    MdHelpOutline, MdClose
} from "react-icons/md";
import { Quicksand } from "next/font/google";
import RichTextLinkModal from "./RichTextLinkModal";
import RichTextVideoModal from "./RichTextVideoModal";

const quicksand = Quicksand({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    withHelpLink?: boolean;
}

const ToolbarButton = ({
    onClick,
    isActive = false,
    children
}: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={`p-1 rounded transition-colors ${isActive ? 'text-[#3A416F] bg-[#FAFAFF]' : 'text-[#5D6494] hover:text-[#3A416F]'
            }`}
        type="button"
    >
        {children}
    </button>
);

export default function RichTextEditor({ value, onChange, placeholder = '', withHelpLink = false }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#7069FA] no-underline cursor-pointer hover:text-[#6660E4] transition-colors',
                },
            }),
            Youtube.configure({
                inline: false,
                HTMLAttributes: {
                    class: 'w-full aspect-video rounded-[8px] my-4 shadow-sm',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-[8px] my-4 shadow-sm',
                },
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: `prose prose-sm focus:outline-none min-h-[345px] px-4 py-3 font-semibold text-[#5D6494] ${quicksand.className} h-full`,
            },
        },
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = useMemo(() => createClient(), []);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Help Link state
    const [showHelpDropdown, setShowHelpDropdown] = useState(false);
    const [helpQuestions, setHelpQuestions] = useState<{ id: string; question: string }[]>([]);
    const [helpSearch, setHelpSearch] = useState("");
    const [loadingHelp, setLoadingHelp] = useState(false);

    // General Link Modal state
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkModalInitialLink, setLinkModalInitialLink] = useState("");
    const [linkModalInitialText, setLinkModalInitialText] = useState("");

    // Video Modal state
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Fetch help questions when dropdown is opened
    useEffect(() => {
        if (showHelpDropdown && helpQuestions.length === 0) {
            const fetchHelp = async () => {
                setLoadingHelp(true);
                const { data } = await supabase
                    .from('help_questions')
                    .select('id, question')
                    .eq('status', 'ON')
                    .order('created_at', { ascending: false });
                if (data) setHelpQuestions(data);
                setLoadingHelp(false);
            };
            fetchHelp();
        }
    }, [showHelpDropdown, helpQuestions.length, supabase]);

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
        setLinkModalInitialLink(previousUrl || "");
        setLinkModalInitialText(text || "");
        setIsLinkModalOpen(true);
    };

    const handleSaveLink = (url: string, text: string) => {
        setIsLinkModalOpen(false);

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        const selection = editor.state.selection;
        const currentText = editor.state.doc.textBetween(selection.from, selection.to, ' ');

        if (text !== currentText && text !== "") {
            editor.chain().focus().extendMarkRange('link').insertContent(`<a href="${url}">${text}</a> `).run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const addYoutubeVideo = () => {
        setIsVideoModalOpen(true);
    };

    const handleSaveVideo = (url: string) => {
        setIsVideoModalOpen(false);
        if (url) {
            editor.commands.setYoutubeVideo({
                src: url,
            });
        }
    };

    const addImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `help/${fileName}`;

            const { error } = await supabase
                .storage
                .from('program-images')
                .upload(filePath, file, { upsert: true });

            if (error) {
                console.error("Supabase Storage error:", error);
                throw error;
            }

            const { data } = supabase
                .storage
                .from('program-images')
                .getPublicUrl(filePath);

            if (!data?.publicUrl) throw new Error("Impossible d'obtenir l'URL publique");

            editor.chain().focus().setImage({ src: data.publicUrl }).run();

        } catch (err) {
            console.error("Erreur d'upload :", err);
            alert("Erreur lors de l'upload de l'image. Assurez-vous que l'image fait moins de 5Mo.");
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const insertHelpLink = (id: string, questionTitle: string) => {
        // If there's text selected, it will turn it into a link.
        // If not, it will insert the question title as link text.
        const selection = editor.state.selection;
        const hasSelection = !selection.empty;
        const url = `/aide?q=${id}`;

        if (!hasSelection) {
            editor.chain().focus().insertContent(`<a href="${url}">${questionTitle}</a> `).run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
        setShowHelpDropdown(false);
        setHelpSearch("");
    };

    const filteredHelp = helpQuestions.filter(q => q.question.toLowerCase().includes(helpSearch.toLowerCase()));

    return (
        <div className="border border-[#D7D4DC] rounded-[5px] bg-white hover:border-[#C2BFC6] transition-colors focus-within:!border-[#A1A5FD] focus-within:ring-1 focus-within:ring-[#A1A5FD] resize-y overflow-auto min-h-[345px] flex flex-col relative w-full">
            <div className="flex items-center gap-1 border-b border-[#D7D4DC] h-[40px] shrink-0 px-2 bg-white shadow-[0px_4px_6px_rgba(93,100,148,0.05)] sticky top-0 z-10 w-full flex-wrap">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                >
                    <MdFormatBold size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                >
                    <MdFormatItalic size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                >
                    <MdFormatUnderlined size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                >
                    <MdFormatStrikethrough size={20} />
                </ToolbarButton>

                <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                >
                    <MdFormatListBulleted size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                >
                    <MdFormatListNumbered size={20} />
                </ToolbarButton>

                <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                <ToolbarButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                >
                    <MdLink size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    isActive={false}
                >
                    <MdLinkOff size={20} />
                </ToolbarButton>

                <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                <ToolbarButton
                    onClick={addImage}
                    isActive={editor.isActive('image')}
                >
                    <MdImage size={20} className={uploadingImage ? "animate-pulse" : ""} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={addYoutubeVideo}
                    isActive={editor.isActive('youtube')}
                >
                    <MdOndemandVideo size={20} />
                </ToolbarButton>

                {withHelpLink && (
                    <>
                        <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />
                        <div className="relative">
                            <ToolbarButton
                                onClick={() => setShowHelpDropdown(!showHelpDropdown)}
                                isActive={showHelpDropdown}
                            >
                                <MdHelpOutline size={20} />
                            </ToolbarButton>

                            {showHelpDropdown && (
                                <div className="absolute top-[30px] right-0 w-[300px] bg-white border border-[#D7D4DC] rounded-[8px] shadow-lg p-3 z-50 flex flex-col gap-2">
                                    <div className="flex justify-between items-center bg-[#FAFAFF] rounded-[5px] px-2 py-1 border border-[#E9E8EE]">
                                        <input
                                            type="text"
                                            placeholder="Rechercher une question..."
                                            value={helpSearch}
                                            onChange={e => setHelpSearch(e.target.value)}
                                            className="bg-transparent border-none outline-none text-[13px] text-[#3A416F] flex-1 font-semibold placeholder:text-[#C2BFC6] placeholder:font-normal h-[24px]"
                                            autoFocus
                                        />
                                        <button onClick={() => setShowHelpDropdown(false)} className="text-[#C2BFC6] hover:text-[#5D6494]">
                                            <MdClose size={16} />
                                        </button>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto pr-1 flex flex-col gap-1">
                                        {loadingHelp ? (
                                            <span className="text-[12px] text-[#A1A5FD] text-center p-2">Chargement...</span>
                                        ) : filteredHelp.length === 0 ? (
                                            <span className="text-[12px] text-[#C2BFC6] text-center p-2">Aucune question trouvée</span>
                                        ) : (
                                            filteredHelp.map(q => (
                                                <button
                                                    key={q.id}
                                                    onClick={() => insertHelpLink(q.id, q.question)}
                                                    className="text-left text-[13px] text-[#5D6494] hover:bg-[#FAFAFF] hover:text-[#7069FA] p-2 rounded-[5px] transition-colors leading-[18px] font-semibold"
                                                >
                                                    {q.question}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <EditorContent editor={editor} />

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
            />

            <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #D7D4DC;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          font-weight: 600;
        }
        .ProseMirror ul {
            list-style-type: disc;
            list-style-position: outside;
            padding-left: 18px;
            margin-left: 0;
        }
        .ProseMirror ol {
            list-style-type: decimal;
            list-style-position: outside;
            padding-left: 18px;
            margin-left: 0;
        }
        .ProseMirror p {
            font-size: 14px;
        }
        .ProseMirror li {
            font-size: 14px;
        }
        .ProseMirror li p {
            margin: 0;
            font-size: 14px;
        }
        .ProseMirror a {
            color: #7069FA;
            text-decoration: none;
            cursor: pointer;
            transition: color 0.15s ease;
        }
        .ProseMirror a:hover {
            color: #6660E4;
        }
        .ProseMirror iframe {
            max-width: 100%;
            border-radius: 8px;
            margin: 16px 0;
            aspect-ratio: 16 / 9;
        }
        /* Mobile responsive adjustments */
        @media (max-width: 640px) {
            .ProseMirror iframe {
                height: auto;
                min-height: 200px;
            }
        }
      `}</style>
            {isLinkModalOpen && (
                <RichTextLinkModal
                    initialLink={linkModalInitialLink}
                    initialText={linkModalInitialText}
                    onSave={handleSaveLink}
                    onCancel={() => setIsLinkModalOpen(false)}
                />
            )}

            {isVideoModalOpen && (
                <RichTextVideoModal
                    onSave={handleSaveVideo}
                    onCancel={() => setIsVideoModalOpen(false)}
                />
            )}
        </div>
    );
}
