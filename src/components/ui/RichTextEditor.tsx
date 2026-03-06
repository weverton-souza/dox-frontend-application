import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import type { VariableInfo } from '@/types'
import VariablePicker from '@/components/editor/VariablePicker'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  label?: string
  placeholder?: string
  variables?: VariableInfo[]
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        px-2 py-1 rounded text-sm font-medium transition-colors
        ${active
          ? 'bg-brand-100 text-brand-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  label,
  placeholder = '',
  variables,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need — keep only bold, italic, paragraph
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external content changes (e.g. undo, load from storage)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  const handleInsertVariable = (variableKey: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(`{{${variableKey}}}`).run()
  }

  if (!editor) return null

  const labelId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      {label && (
        <label
          htmlFor={labelId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-colors">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito (Ctrl+B)"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico (Ctrl+I)"
          >
            <span className="italic">I</span>
          </ToolbarButton>

          {/* Variable picker — only shown when variables are provided */}
          {variables && variables.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <VariablePicker
                variables={variables}
                onInsert={handleInsertVariable}
              />
            </>
          )}
        </div>

        {/* Editor area */}
        <EditorContent
          editor={editor}
          className="rich-text-editor px-3 py-2 text-sm min-h-[80px] text-gray-900"
        />
      </div>
    </div>
  )
}
