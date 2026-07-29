"use client"

import { useEditor, EditorContent, ReactRenderer, Extension } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { Placeholder } from "@tiptap/extensions"
import Suggestion from "@tiptap/suggestion"
import { BubbleMenu } from "@tiptap/react/menus"
import { cn } from "@/lib/utils"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import type { Editor, Range } from "@tiptap/core"
import { Bold, Code, Code2, Heading1, Heading2, Heading3, Italic, Link, List, ListOrdered, Minus, CheckSquare, Quote, Strikethrough, Underline as UnderlineIcon } from "lucide-react"

interface SlashCommandItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  command: (props: { editor: Editor; range: Range }) => void
}

const slashItems: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Just start writing with plain text.",
    icon: Code2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run()
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list.",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "Task List",
    description: "Add a list with checkboxes.",
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: "Blockquote",
    description: "Capture a quote.",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: "Code Block",
    description: "Capture a code snippet.",
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: "Divider",
    description: "Insert a horizontal rule.",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
]

interface SlashPopupProps {
  items: SlashCommandItem[]
  command: (commandProps: unknown) => void
  query: string
}

const SlashPopup = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, SlashPopupProps>(
  ({ items, command, query }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const filtered = items.filter((item) =>
      item.title.toLowerCase().startsWith(query.toLowerCase())
    )

    useEffect(() => {
      setSelectedIndex(0)
    }, [query])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i > 0 ? i - 1 : filtered.length - 1))
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i < filtered.length - 1 ? i + 1 : 0))
          return true
        }
        if (event.key === "Enter") {
          const item = filtered[selectedIndex]
          if (item) {
            command(item.command)
          }
          return true
        }
        return false
      },
    }))

    return (
      <div className="bg-popover text-popover-foreground shadow-xl border rounded-xl p-1.5 w-64 max-h-72 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No results</div>
        )}
        {filtered.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md text-left transition-colors",
              index === selectedIndex && "bg-accent text-accent-foreground"
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              command(item.command)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <item.icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </div>
          </button>
        ))}
      </div>
    )
  }
)
SlashPopup.displayName = "SlashPopup"

interface RichEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichEditor({
  content = "",
  onChange,
  placeholder = "Type / to insert blocks...",
  className,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2",
          },
        },
      }),
      TaskList.configure({
        HTMLAttributes: { class: "not-prose" },
      }),
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Extension.create({
        name: "slashCommand",
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              char: "/",
              placement: "bottom-start",
              offset: { mainAxis: 4 },
              command: ({ editor, range, props }) => {
                props({ editor, range })
              },
              items: ({ query }) =>
                slashItems.filter((item) =>
                  item.title.toLowerCase().startsWith(query.toLowerCase())
                ),
              render: () => {
                let component: ReactRenderer<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }> | null = null

                return {
                  onBeforeStart(props) {
                    component = new ReactRenderer(SlashPopup, {
                      props: {
                        items: slashItems,
                        command: props.command,
                        query: props.query,
                      },
                      editor: props.editor,
                    })
                  },
                  onStart(props) {
                    if (!component) return
                    props.mount(component.element)
                  },
                  onBeforeUpdate(props) {
                    component?.updateProps({
                      items: slashItems,
                      command: props.command,
                      query: props.query,
                    } satisfies SlashPopupProps)
                  },
                  onKeyDown(props) {
                    if (props.event.key === "Escape") {
                      component?.destroy()
                      return true
                    }
                    return component?.ref?.onKeyDown(props) ?? false
                  },
                  onExit() {
                    component?.destroy()
                  },
                }
              },
            }),
          ]
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className={cn("relative min-h-[inherit]", className)}>
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 bg-popover border rounded-xl shadow-xl p-1"
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Bold"
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="Italic"
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          label="Underline"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          label="Strikethrough"
        >
          <Strikethrough className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          label="Code"
        >
          <Code className="size-3.5" />
        </ToolbarButton>
        <span className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("Enter URL:")
            if (url) {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
            }
          }}
          active={editor.isActive("link")}
          label="Link"
        >
          <Link className="size-3.5" />
        </ToolbarButton>
      </BubbleMenu>
      <EditorContent
        editor={editor}
        className="rich-editor"
      />
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  active: boolean
  label: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center justify-center size-7 rounded-md transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  )
}


