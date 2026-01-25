import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough, MdFormatListBulleted, MdFormatListNumbered } from "react-icons/md";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
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

export default function RichTextEditor({ value, onChange, placeholder = '' }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base focus:outline-none min-h-[120px] max-h-[300px] overflow-y-auto px-4 py-3 font-semibold text-[#5D6494] ${quicksand.className}`,
            },
        },
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-[#D7D4DC] rounded-[5px] bg-white hover:border-[#C2BFC6] transition-colors focus-within:!border-[#A1A5FD] focus-within:ring-1 focus-within:ring-[#A1A5FD] overflow-hidden">
            <div className="flex items-center gap-1 border-b border-[#D7D4DC] h-[40px] px-2 bg-white shadow-[0px_4px_6px_rgba(93,100,148,0.05)] relative z-10">
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
        .ProseMirror li p {
            margin: 0;
        }
      `}</style>
        </div>
    );
}
