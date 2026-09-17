import { Placeholder } from '@tiptap/extensions';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
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
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent',
        active && 'bg-brand-soft text-gray-900',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden="true" />;
}

const headingOptions = [
  { label: 'Normal', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
] as const;

function Toolbar({ editor }: { editor: Editor }) {
  // Subscribes to the bits of editor state the toolbar renders, and nothing else.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
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
      className="flex flex-wrap items-center gap-0.5 rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-gray-100"
    >
      <ToolbarButton label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 className="size-4" />
      </ToolbarButton>
      <Divider />
      <select
        aria-label="Text style"
        value={state.heading}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const level = Number(e.target.value) as 0 | 1 | 2 | 3;
          if (level === 0) chain().setParagraph().run();
          else chain().toggleHeading({ level }).run();
        }}
        className="h-7 rounded bg-transparent px-1 text-xs text-gray-600 outline-none hover:bg-gray-100"
      >
        {headingOptions.map((option) => (
          <option key={option.level} value={option.level}>
            {option.label}
          </option>
        ))}
      </select>
      <Divider />
      <ToolbarButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => chain().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={state.underline}
        onClick={() => chain().toggleUnderline().run()}
      >
        <Underline className="size-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Align left"
        active={state.left}
        onClick={() => chain().setTextAlign('left').run()}
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={state.center}
        onClick={() => chain().setTextAlign('center').run()}
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={state.right}
        onClick={() => chain().setTextAlign('right').run()}
      >
        <AlignRight className="size-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Numbered list"
        active={state.ordered}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bulleted list"
        active={state.bullet}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Indent"
        disabled={!state.canSink}
        onClick={() => chain().sinkListItem('listItem').run()}
      >
        <IndentIncrease className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Outdent"
        disabled={!state.canLift}
        onClick={() => chain().liftListItem('listItem').run()}
      >
        <IndentDecrease className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={state.quote}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Strikethrough"
        active={state.strike}
        onClick={() => chain().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
    </div>
  );
}

/** Rich-text body with the toolbar from the design. The parent reads HTML through `onEditor`. */
export function BodyEditor({ onEditor }: BodyEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Type Your Reply...' }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose-email min-h-[260px] px-1 py-3 text-[13px] leading-6 text-gray-800 outline-none',
        'aria-label': 'Email body',
      },
    },
  });

  useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);

  return (
    <div className="rounded-lg bg-canvas px-3 pt-3 pb-2">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
