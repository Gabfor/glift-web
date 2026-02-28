import { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import ImageResize from 'tiptap-extension-resize-image';
import TextAlign from '@tiptap/extension-text-align';
import {
    MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough,
    MdFormatListBulleted, MdFormatListNumbered, MdLink, MdLinkOff, MdOndemandVideo, MdImage,
    MdHelpOutline, MdClose, MdEmojiEmotions,
    MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight
} from "react-icons/md";
import { Quicksand } from "next/font/google";
import RichTextLinkModal from "./RichTextLinkModal";
import RichTextVideoModal from "./RichTextVideoModal";
import RichTextHelpLinkModal from "./RichTextHelpLinkModal";
import RichTextImageModal from "./RichTextImageModal";
import EmojiPicker from 'emoji-picker-react';

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

const GlobalAttributes = Extension.create({
    name: 'globalAttributes',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    class: {
                        default: null,
                        parseHTML: element => element.getAttribute('class'),
                        renderHTML: attributes => {
                            if (!attributes.class) return {};
                            return { class: attributes.class };
                        },
                    },
                    style: {
                        default: null,
                        parseHTML: element => element.getAttribute('style'),
                        renderHTML: attributes => {
                            if (!attributes.style) return {};
                            return { style: attributes.style };
                        },
                    },
                },
            },
            {
                types: ['image', 'imageResize'],
                attributes: {
                    style: {
                        default: null,
                        parseHTML: element => element.getAttribute('style'),
                        renderHTML: attributes => {
                            if (!attributes.style) return {};
                            return { style: attributes.style };
                        },
                    },
                },
            },
        ];
    },
});

const ImageCaption = Node.create({
    name: 'imageCaption',
    group: 'block',
    content: 'inline*',
    parseHTML() {
        return [
            { tag: 'p.image-caption' },
            { tag: 'figcaption' },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['p', mergeAttributes(HTMLAttributes, { class: 'image-caption' }), 0];
    },
});

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
            GlobalAttributes,
            ImageCaption,
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image', 'imageResize'],
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
            ImageResize.configure({
                inline: false,
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

    // Help Link Modal state
    const [isHelpLinkModalOpen, setIsHelpLinkModalOpen] = useState(false);
    const [helpLinkInitialText, setHelpLinkInitialText] = useState("");

    // Image Modal state
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // General Link Modal state
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkModalInitialLink, setLinkModalInitialLink] = useState("");
    const [linkModalInitialText, setLinkModalInitialText] = useState("");

    // Video Modal state
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Emoji Picker state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
        setIsImageModalOpen(true);
    };

    const handleSaveImage = (url: string, alt: string, description: string) => {
        if (!url) return;

        // "containerstyle" is for Tiptap editor extension. "style" is for native public frontend HTML parsing.
        let content = `<img src="${url}" alt="${alt}" style="display: block; margin: 0 auto; width: 200px; max-width: 100%;" containerstyle="display: block; margin: 0 auto; width: 200px; max-width: 100%;" />`;

        if (description) {
            content += `<p class="image-caption" style="text-align: center; color: #D7D4DC; font-size: 12px; font-weight: 500; margin-top: 8px; margin-bottom: 0px;">${description}</p>`;
        }

        content += `<p></p>`;

        editor.chain().focus().insertContent(content).run();
    };

    const handleSaveHelpLink = (helpId: string, text: string) => {
        const url = `/aide?q=${helpId}`;
        const selection = editor.state.selection;
        const currentText = editor.state.doc.textBetween(selection.from, selection.to, ' ');

        if (text !== currentText && text !== "") {
            editor.chain().focus().insertContent(`<a href="${url}">${text}</a> `).run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }

        setIsHelpLinkModalOpen(false);
    };

    const handleOpenHelpLinkModal = () => {
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
        setHelpLinkInitialText(text || "");
        setIsHelpLinkModalOpen(true);
    };
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
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                >
                    <MdFormatAlignLeft size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                >
                    <MdFormatAlignCenter size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                >
                    <MdFormatAlignRight size={20} />
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
                    <MdImage size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={addYoutubeVideo}
                    isActive={editor.isActive('youtube')}
                >
                    <MdOndemandVideo size={20} />
                </ToolbarButton>

                <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                <div className="relative">
                    <ToolbarButton
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        isActive={showEmojiPicker}
                    >
                        <MdEmojiEmotions size={20} />
                    </ToolbarButton>

                    {showEmojiPicker && (
                        <div className="absolute top-[30px] right-0 z-50 shadow-lg rounded-[8px] bg-white">
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    editor.chain().focus().insertContent(emojiData.emoji).run();
                                    setShowEmojiPicker(false);
                                }}
                                width={300}
                                height={400}
                                searchPlaceHolder="Rechercher un emoji..."
                                previewConfig={{ showPreview: false }}
                            />
                        </div>
                    )}
                </div>

                {withHelpLink && (
                    <>
                        <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />
                        <div className="relative">
                            <ToolbarButton
                                onClick={handleOpenHelpLinkModal}
                                isActive={isHelpLinkModalOpen}
                            >
                                <MdHelpOutline size={20} />
                            </ToolbarButton>
                        </div>
                    </>
                )}
            </div>

            <EditorContent editor={editor} />

            <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #D7D4DC;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          font-weight: 600;
        }
        .ProseMirror p.image-caption {
            color: #D7D4DC !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            text-align: center !important;
            margin-top: 8px !important;
            margin-bottom: 0px !important;
            width: 100%;
            display: block;
        }
        .ProseMirror img {
            margin-top: 0px !important;
            margin-bottom: 0px !important;
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

            {isHelpLinkModalOpen && (
                <RichTextHelpLinkModal
                    initialText={helpLinkInitialText}
                    onSave={handleSaveHelpLink}
                    onCancel={() => setIsHelpLinkModalOpen(false)}
                />
            )}

            <RichTextImageModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onSave={handleSaveImage}
            />
        </div>
    );
}
