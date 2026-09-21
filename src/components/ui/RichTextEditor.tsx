import { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Selection } from '@tiptap/pm/state';
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
    editorClassName?: string;
    containerClassName?: string;
    minimal?: boolean;
    minHeight?: string;
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
                            if (!attributes.class) {
                                return {};
                            }
                            return {
                                class: attributes.class,
                            };
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

const EnterKeymap = Extension.create({
    name: 'enterKeymap',
    priority: 1000,
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;

                // 1. Si une sélection de texte existe (non vide), laisser le comportement par défaut supprimer la sélection
                if (!empty) {
                    return false;
                }

                // 2. Si on est dans une liste (bullet list ou ordered list), laisser le comportement par défaut (nouvel item ou sortie de liste)
                let insideList = false;
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'listItem' || node.type.name === 'bulletList' || node.type.name === 'orderedList') {
                        insideList = true;
                        break;
                    }
                }
                if (insideList) {
                    return false;
                }

                // 3. Si on est dans un titre (h2, h3), laisser le comportement par défaut (créer un paragraphe en dessous)
                if ($from.parent.type.name === 'heading') {
                    return false;
                }

                // 4. Si on n'est pas dans un paragraphe, laisser le comportement par défaut
                if ($from.parent.type.name !== 'paragraph') {
                    return false;
                }

                const parent = $from.parent;

                // 5. Si le paragraphe est totalement vide, créer une nouvelle ligne vide (splitBlock)
                if (parent.content.size === 0) {
                    return this.editor.commands.splitBlock();
                }

                // 6. Si le curseur suit immédiatement un hardBreak (<br>), c'est le 2e "Entrée" consécutif !
                // On supprime le <br> précédent et on sépare en un nouveau paragraphe (<p>) pour créer un vrai saut de ligne
                if ($from.nodeBefore && $from.nodeBefore.type.name === 'hardBreak') {
                    const hardBreakSize = $from.nodeBefore.nodeSize || 1;
                    return this.editor
                        .chain()
                        .command(({ tr }) => {
                            tr.delete($from.pos - hardBreakSize, $from.pos);
                            return true;
                        })
                        .splitBlock()
                        .run();
                }

                // 7. Si on est au tout début du paragraphe ($from.parentOffset === 0), créer un paragraphe au-dessus
                // au lieu d'insérer un <br> en tête de texte qui créerait un double espace artificiel
                if ($from.parentOffset === 0) {
                    return this.editor.commands.splitBlock();
                }

                // 8. 1er "Entrée" : insérer un hardBreak (<br>) pour aller directement à la ligne sans saut de ligne (espacement de paragraphe)
                return this.editor.commands.setHardBreak();
            },
            'Shift-Enter': () => {
                return this.editor.commands.setHardBreak();
            },
            Backspace: () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;

                if (!empty) {
                    return false;
                }

                // Si on est dans un paragraphe vide sous une liste, supprimer le paragraphe et revenir dans la liste
                if ($from.parent.type.name === 'paragraph' && $from.parent.content.size === 0) {
                    const index = $from.index(0);
                    const prevNode = index > 0 ? state.doc.child(index - 1) : null;

                    if (prevNode && (prevNode.type.name === 'bulletList' || prevNode.type.name === 'orderedList')) {
                        const pStart = $from.before(1);
                        const pEnd = $from.after(1);
                        const tr = state.tr.delete(pStart, pEnd);
                        tr.setSelection(Selection.near(tr.doc.resolve(pStart - 1), -1));
                        this.editor.view.dispatch(tr);
                        return true;
                    }
                }

                return false;
            },
            Delete: () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;

                if (!empty) {
                    return false;
                }

                // Si on est à la toute fin d'une liste et que le bloc suivant est un paragraphe vide, le supprimer
                let listDepth = -1;
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
                        listDepth = d;
                        break;
                    }
                }

                if (listDepth > 0) {
                    const listEnd = $from.after(listDepth);
                    if ($from.pos >= listEnd - 3) {
                        const doc = state.doc;
                        const $afterList = doc.resolve(listEnd);
                        const nextNode = $afterList.nodeAfter;
                        if (nextNode && nextNode.type.name === 'paragraph' && nextNode.content.size === 0) {
                            const tr = state.tr.delete(listEnd, listEnd + nextNode.nodeSize);
                            this.editor.view.dispatch(tr);
                            return true;
                        }
                    }
                }

                return false;
            },
        };
    },
});

const ImageCaption = Node.create({
    name: 'imageCaption',
    group: 'block',
    content: 'inline*',
    parseHTML() {
        return [
            {
                tag: 'span.image-caption',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'image-caption' }), 0];
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

export default function RichTextEditor({ 
    value, 
    onChange, 
    placeholder = '', 
    withHelpLink = false, 
    editorClassName, 
    containerClassName,
    minimal = false,
    minHeight
}: RichTextEditorProps) {
    const pathname = usePathname();
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isPageAdmin =
        pathname?.startsWith("/admin") ||
        hostname.startsWith("admin.") ||
        hostname.includes("admin") ||
        pathname?.startsWith("/program") ||
        pathname?.startsWith("/program-store") ||
        pathname?.startsWith("/offer-shop") ||
        pathname?.startsWith("/content-blog") ||
        pathname?.startsWith("/help") ||
        pathname?.startsWith("/users") ||
        pathname?.startsWith("/create-") ||
        pathname?.startsWith("/slider") ||
        pathname?.startsWith("/legal") ||
        pathname?.startsWith("/administrateurs") ||
        pathname?.startsWith("/auteurs") ||
        pathname?.startsWith("/settings");

    const sanitizedValue = useMemo(() => {
        if (!value) return value;
        let clean = value.replace(/<h1(\s|>)/gi, '<p$1').replace(/<\/h1>/gi, '</p>');
        // Supprimer les balises <p></p> vides résiduelles en fin de contenu ou juste sous une liste
        clean = clean.replace(/<\/(ul|ol)>\s*<p><\/p>$/gi, '</$1>');
        return clean;
    }, [value]);

    const editor = useEditor({
        extensions: [
            EnterKeymap,
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
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
                validate: (href) => /^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('/'),
            }),
            Youtube.configure({
                inline: false,
                HTMLAttributes: {
                    class: 'w-full aspect-video rounded-[8px] my-4 shadow-glift',
                },
            }),
            ...(typeof window !== 'undefined' ? [ImageResize.configure({
                inline: false,
            })] : []),
        ],
        content: sanitizedValue,
        editorProps: {
            attributes: {
                class: `prose prose-sm focus:outline-none px-4 py-3 font-semibold text-[#5D6494] ${quicksand.className} ${editorClassName || 'h-full'} [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-[#2E3271] [&_h2]:my-3 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-[#2E3271] [&_h3]:my-2 [&_p]:mt-0 [&_p]:mb-3.5`,
                spellcheck: "true",
                style: !editorClassName && minHeight ? `min-height: ${minHeight}` : !editorClassName ? 'min-height: 345px' : '',
            },
            transformPastedHTML(html) {
                // Interdire les <h1> : rétrogradation automatique en <p> lors du copier-coller
                return html.replace(/<h1(\s|>)/gi, '<p$1').replace(/<\/h1>/gi, '</p>');
            },
        },
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            let html = editor.getHTML();
            html = html.replace(/<\/(ul|ol)>\s*<p><\/p>$/gi, '</$1>');
            onChange(html);
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
            const cleanVal = value ? value.replace(/<h1(\s|>)/gi, '<p$1').replace(/<\/h1>/gi, '</p>').replace(/<\/(ul|ol)>\s*<p><\/p>$/gi, '</$1>') : value;
            editor.commands.setContent(cleanVal);
        }
    }, [value, editor]);

    // Removed if (!editor) return null to prevent layout flash during initialization.

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
        setLinkModalInitialLink(previousUrl || "");
        setLinkModalInitialText(text || "");
        setIsLinkModalOpen(true);
    };

    const handleSaveLink = (url: string, text: string) => {
        if (!editor) return;
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
        if (!editor) return;
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
        if (!editor) return;
        if (!url) return;

        // "containerstyle" is for Tiptap editor extension. "style" is for native public frontend HTML parsing.
        let content = `<img src="${url}" alt="${alt}" style="display: block; margin: 0 auto; width: 200px; max-width: 100%;" containerstyle="display: block; margin: 0 auto; width: 200px; max-width: 100%;" />`;

        if (description) {
            content += `<p class="image-caption" style="text-align: center; color: #D7D4DC; font-size: 12px; font-weight: 500; margin-top: 8px; margin-bottom: 0px;">${description}</p>`;
        }

        content += ` `;

        editor.chain().focus().insertContent(content).run();
    };

    const handleSaveHelpLink = (helpId: string, text: string) => {
        if (!editor) return;
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
        if (!editor) return;
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
        setHelpLinkInitialText(text || "");
        setIsHelpLinkModalOpen(true);
    };
    return (
        <div 
            className={`border border-[#D7D4DC] rounded-[5px] bg-white hover:border-[#C2BFC6] transition-colors ${
                isPageAdmin
                    ? "focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#5D6494]"
                    : "focus-within:!border-[#A1A5FD] focus-within:ring-1 focus-within:ring-[#5D6494]"
            } flex flex-col relative w-full ${containerClassName || 'resize-y overflow-auto'}`}
            style={!containerClassName && minHeight ? { minHeight } : !containerClassName ? { minHeight: '345px' } : {}}
        >
            <div className="flex items-center gap-1 border-b border-[#D7D4DC] h-[40px] shrink-0 px-2 bg-white shadow-glift sticky top-0 z-10 w-full flex-wrap">
                {/* Format de texte : Normal (<p>), Sous-titre (<h2>), Sous-section (<h3>) */}
                <button
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                    className={`px-2 h-[26px] rounded-[4px] text-[12px] font-bold transition-all duration-150 flex items-center justify-center ${
                        editor?.isActive('paragraph') && !editor?.isActive('heading')
                            ? 'bg-[#3A416F] text-white'
                            : 'text-[#5D6494] hover:text-[#3A416F] hover:bg-[#F4F5FE]'
                    }`}
                    type="button"
                    title="Texte normal (<p>)"
                >
                    Normal
                </button>

                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 h-[26px] rounded-[4px] text-[12px] font-bold transition-all duration-150 flex items-center justify-center ${
                        editor?.isActive('heading', { level: 2 })
                            ? 'bg-[#3A416F] text-white'
                            : 'text-[#5D6494] hover:text-[#3A416F] hover:bg-[#F4F5FE]'
                    }`}
                    type="button"
                    title="Sous-titre (<h2>)"
                >
                    H2
                </button>

                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-2 h-[26px] rounded-[4px] text-[12px] font-bold transition-all duration-150 flex items-center justify-center ${
                        editor?.isActive('heading', { level: 3 })
                            ? 'bg-[#3A416F] text-white'
                            : 'text-[#5D6494] hover:text-[#3A416F] hover:bg-[#F4F5FE]'
                    }`}
                    type="button"
                    title="Sous-section (<h3>)"
                >
                    H3
                </button>

                <div className="w-[1px] h-[20px] bg-[#D7D4DC] mx-1" />

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    isActive={editor?.isActive('bold') ?? false}
                >
                    <MdFormatBold size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    isActive={editor?.isActive('italic') ?? false}
                >
                    <MdFormatItalic size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    isActive={editor?.isActive('underline') ?? false}
                >
                    <MdFormatUnderlined size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    isActive={editor?.isActive('strike') ?? false}
                >
                    <MdFormatStrikethrough size={20} />
                </ToolbarButton>

                {!minimal && (
                    <>
                        <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                        <ToolbarButton
                            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                            isActive={editor?.isActive({ textAlign: 'left' }) ?? false}
                        >
                            <MdFormatAlignLeft size={20} />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                            isActive={editor?.isActive({ textAlign: 'center' }) ?? false}
                        >
                            <MdFormatAlignCenter size={20} />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                            isActive={editor?.isActive({ textAlign: 'right' }) ?? false}
                        >
                            <MdFormatAlignRight size={20} />
                        </ToolbarButton>
                    </>
                )}

                <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    isActive={editor?.isActive('bulletList') ?? false}
                >
                    <MdFormatListBulleted size={20} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    isActive={editor?.isActive('orderedList') ?? false}
                >
                    <MdFormatListNumbered size={20} />
                </ToolbarButton>

                {!minimal && (
                    <>
                        <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                        <ToolbarButton
                            onClick={setLink}
                            isActive={editor?.isActive('link') ?? false}
                        >
                            <MdLink size={20} />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor?.chain().focus().unsetLink().run()}
                            isActive={false}
                        >
                            <MdLinkOff size={20} />
                        </ToolbarButton>

                        <div className="w-[1px] h-[24px] bg-[#D7D4DC] mx-1" />

                        <ToolbarButton
                            onClick={addImage}
                            isActive={editor?.isActive('image') ?? false}
                        >
                            <MdImage size={20} />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={addYoutubeVideo}
                            isActive={editor?.isActive('youtube') ?? false}
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
                                <div className="absolute top-[30px] right-0 z-50 shadow-glift-hover rounded-[8px] bg-white">
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) => {
                                            editor?.chain().focus().insertContent(emojiData.emoji).run();
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
                    </>
                )}
            </div>

            {editor ? (
                <EditorContent editor={editor} />
            ) : (
                <div className={`px-4 py-3 min-h-[345px] ${editorClassName}`} />
            )}

            <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #D7D4DC;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          font-weight: 600;
        }
        .ProseMirror .image-caption,
        .ProseMirror .image-caption *,
        .ProseMirror p.image-caption,
        .ProseMirror p.image-caption * {
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
        .ProseMirror ul,
        .ProseMirror ol {
            list-style-position: outside;
            padding-left: 22px;
            margin-left: 0;
            margin-top: 8px !important;
            margin-bottom: 12px !important;
        }
        .ProseMirror ul {
            list-style-type: disc;
        }
        .ProseMirror ol {
            list-style-type: decimal;
        }
        .ProseMirror li {
            font-size: 14px;
            margin-top: 2px !important;
            margin-bottom: 2px !important;
        }
        .ProseMirror li p {
            margin: 0 !important;
            font-size: 14px;
            line-height: 1.5;
        }
        .ProseMirror ul + p,
        .ProseMirror ol + p {
            margin-top: 0 !important;
        }
        .ProseMirror p > br:first-child:not(:only-child) {
            display: none !important;
        }
        .ProseMirror p {
            font-size: 14px;
            margin-top: 0;
            margin-bottom: 14px;
            line-height: 1.6;
        }
        .ProseMirror p:empty,
        .ProseMirror p.is-empty {
            min-height: 1.5em;
        }
        .ProseMirror li {
            font-size: 14px;
        }
        .ProseMirror li p {
            margin: 0;
            font-size: 14px;
        }
        .ProseMirror a,
        .ProseMirror a[class*="text-"],
        .ProseMirror a span {
            color: #7069FA !important;
            text-decoration: none;
            cursor: pointer;
            transition: color 0.15s ease;
        }
        .ProseMirror a:hover,
        .ProseMirror a:hover *,
        .ProseMirror a[class*="text-"]:hover {
            color: #6660E4 !important;
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
