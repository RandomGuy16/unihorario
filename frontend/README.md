# Unihorario Frontend

Frontend for building university schedules from official course sections.

## What This App Does

- Shows available courses/sections grouped by career, cycle, and study plan.
- Lets users add valid sections into a weekly calendar grid.
- Prevents arbitrary schedule creation by using only faculty-defined section shifts.
- Supports uploading assignment programming PDFs through the backend flow.
- Supports schedule export.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- `pnpm` package manager

## Run Locally

```bash
pnpm install
pnpm dev
```

App URL: `http://localhost:3000`

## Required Environment Variable

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Point this URL to your deployed backend in non-local environments.

## Common Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Project Structure (high level)

- `app/components/`: UI components (sidebar, schedule, modals).
- `app/providers/`: state and context providers.
- `app/services/`: API client modules (`CatalogService`, `CurriculumService`).
- `app/models/`: shared frontend domain models and DTOs.

## Notes

- Upload and parsing status depend on backend jobs (`/api/jobs/*` endpoints).
- Keep UI behavior aligned with backend constraints for section schedules and metadata.
