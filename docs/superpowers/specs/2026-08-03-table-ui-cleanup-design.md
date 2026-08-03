# Table UI cleanup

## Goal

Make the editable table readable, maintainable, and visually consistent with the project's existing shadcn and Tailwind components without adding a table framework or speculative abstractions.

## Scope

- Preserve editable rows, columns, status options, file uploads, embedded links, and attachment rename/remove actions.
- Keep horizontal scrolling and a sticky header. The row-action gutter and every data column scroll horizontally together.
- Render rows normally. The current table does not need custom virtualization, fixed-row calculations, spacer rows, resize observers, or manual scroll listeners.
- Give the shared `Table` component a small, typed API for styling and referencing its scroll container.
- Keep component-specific styling in Tailwind classes. Remove the table-only scrollbar class from `app/globals.css`.
- Improve comments and names only where they explain a non-obvious constraint.

## Component boundaries

`components/ui/table.tsx` owns the table's outer scroll container and accepts optional `containerClassName` and `containerRef` props. All normal table element props continue to reach the `<table>` element.

`components/dashboard/table-type.tsx` owns editable-table behavior and presentation. It uses the shared table container API for bounded scrolling and sticky cells, but does not implement a separate scrolling system.

The header sticks only on the vertical axis. The Name header and cells must not use `left-*` positioning or horizontal sticky behavior.

`app/globals.css` remains limited to theme tokens, application-wide base rules, and genuinely global rich-editor styling.

## Verification

- Add a focused test for the shared table container contract if the repository's test tooling supports component tests without introducing new dependencies.
- Run ESLint on the touched TypeScript files.
- Run the production build to catch TypeScript and Next.js integration errors.
- Review the final diff and confirm no unrelated files, branches, commits, or pushes were created.

## Non-goals

- Server persistence, sorting, filtering, pagination, drag-and-drop, or bulk editing.
- A reusable data-grid abstraction.
- Virtualized rendering before real row-count performance evidence exists.
- A global custom scrollbar theme.
