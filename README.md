# Daily Planner (React + TypeScript)

A modern, responsive daily planner web app with folders, task management, and a calendar view.  
Data is persisted in the browser using `localStorage`, so your tasks stay available between sessions.

## Features

- Folder management: create, rename, and delete folders
- Task management: create, edit, delete, complete/incomplete
- Task fields: title, subject, due date, date assigned, folder, notes
- Sidebar folder browser with task counts
- All Tasks view sorted by due date
- Folder-specific task filtering
- Calendar view with clickable dates and due task counts
- Overdue and completed visual states
- Empty states, form validation, and destructive action confirmations
- Local persistence with `localStorage`

## Tech Stack

- React
- TypeScript
- Vite
- `date-fns` for date formatting and calendar utilities

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open the local URL shown in the terminal (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Data Model

### Folders

- `id`
- `name`
- `createdAt`

### Tasks

- `id`
- `title`
- `subject`
- `dueDate`
- `dateAssigned`
- `folderId`
- `completed`
- `notes`
- `createdAt`
- `updatedAt`
