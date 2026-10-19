import { Placeholder } from '@tiptap/extensions';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface BodyEditorProps {
  onEditor: (editor: Editor | null) => void;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-lg font-medium transition-colors select-none cursor-pointer',
        'text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent',
        active && 'bg-primary-container text-on-primary-container hover:bg-primary-container shadow-xs',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-outline-variant/40" aria-hidden="true" />;
}

const headingOptions = [
  { label: 'Normal Text', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
] as const;

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      heading: [1, 2, 3].find((level) => e.isActive('heading', { level })) ?? 0,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      canSink: e.can().sinkListItem('listItem'),
      canLift: e.can().liftListItem('listItem'),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 rounded-xl bg-surface-container-low border border-outline-variant/40 p-1.5 shadow-xs"
    >
      <ToolbarButton
        label="Undo"
        disabled={!state.canUndo}
        onClick={() => chain().undo().run()}
      >
        <span className="material-symbols-outlined text-[18px]">undo</span>
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!state.canRedo}
        onClick={() => chain().redo().run()}
      >
        <span className="material-symbols-outlined text-[18px]">redo</span>
      </ToolbarButton>

      <Divider />

      <select
        aria-label="Text hierarchy"
        value={state.heading}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const level = Number(e.target.value) as 0 | 1 | 2 | 3;
          if (level === 0) chain().setParagraph().run();
          else chain().toggleHeading({ level }).run();
        }}
        className="h-8 rounded-lg bg-surface-container-lowest border border-outline-variant/40 px-2 font-body-sm text-body-sm text-on-surface outline-none hover:border-primary/60 transition-colors"
      >
        {headingOptions.map((option) => (
          <option key={option.level} value={option.level}>
            {option.label}
          </option>
        ))}
      </select>

      <Divider />

      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => chain().toggleBold().run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_bold</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => chain().toggleItalic().run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_italic</span>
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={state.strike}
        onClick={() => chain().toggleStrike().run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_strikethrough</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Align left"
        active={state.left}
        onClick={() => chain().setTextAlign('left').run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_align_left</span>
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={state.center}
        onClick={() => chain().setTextAlign('center').run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_align_center</span>
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={state.right}
        onClick={() => chain().setTextAlign('right').run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_align_right</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Numbered list"
        active={state.ordered}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
      </ToolbarButton>
      <ToolbarButton
        label="Bulleted list"
        active={state.bullet}
        onClick={() => chain().toggleBulletList().run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
      </ToolbarButton>
      <ToolbarButton
        label="Indent"
        disabled={!state.canSink}
        onClick={() => chain().sinkListItem('listItem').run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_indent_increase</span>
      </ToolbarButton>
      <ToolbarButton
        label="Outdent"
        disabled={!state.canLift}
        onClick={() => chain().liftListItem('listItem').run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_indent_decrease</span>
      </ToolbarButton>
      <ToolbarButton
        label="Blockquote"
        active={state.quote}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <span className="material-symbols-outlined text-[18px]">format_quote</span>
      </ToolbarButton>
    </div>
  );
}

export function BodyEditor({ onEditor }: BodyEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Draft your outreach message or notification here...' }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose-email min-h-[300px] p-space-md font-body-base text-body-base text-on-surface outline-none leading-relaxed',
        'aria-label': 'Email body',
      },
    },
  });

  useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);

  return (
    <div className="flex flex-col gap-2 mt-2">
      {editor && <Toolbar editor={editor} />}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
