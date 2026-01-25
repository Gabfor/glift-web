import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered } from 'lucide-react';

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
        className={`p-1 rounded transition-colors ${isActive ? 'text-[#3A416F] bg-gray-100' : 'text-[#5D6494] hover:text-[#3A416F]'
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
                class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[120px] max-h-[300px] overflow-y-auto px-4 py-3 font-semibold text-[#5D6494]',
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
            <div className="flex items-center gap-1 border-b border-[#D7D4DC] px-2 py-2 bg-white">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                >
                    <Bold size={18} strokeWidth={2.5} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                >
                    <Italic size={18} strokeWidth={2.5} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                >
                    <UnderlineIcon size={18} strokeWidth={2.5} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                >
                    <Strikethrough size={18} strokeWidth={2.5} />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                >
                    <List size={18} strokeWidth={2.5} />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                >
                    <ListOrdered size={18} strokeWidth={2.5} />
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
            padding-left: 1.5em;
        }
        .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
        }
      `}</style>
        </div>
    );
}
