# CourseDrop

CourseDrop is a role-based study material portal built with Next.js.

It supports:
- Students: browse and download materials without login.
- Teachers: request subject access, upload files, preview student view.
- Admins: approve requests and teachers, manage all materials and sharing.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (data + auth backing)
- Google Drive API (file storage)

## Key Features

- Subject-wise file organization with section tagging
- Role-based access and approvals
- Shared course access between approved teachers
- Batch file downloads as ZIP
- Bug reporting flow
- Dark mode support
- Responsive layout for laptop, tablet, mobile, and orientation changes

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open http://localhost:3000.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run build:gh-pages
npm run deploy:gh-pages
npm run deploy
```

## Environment Variables

Create a .env.local file for local development and configure the same values in production.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Email (forgot-password OTP)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_NAME=CourseDrop

# Google Drive (choose one mode)
# Mode A: OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=

# Mode B: Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_DELEGATED_USER_EMAIL=

# Drive root configuration
GOOGLE_DRIVE_MASTER_FOLDER_ID=
GOOGLE_DRIVE_SHARED_DRIVE_ID=

# Optional admin hardening
ADMIN_DELETE_PASSWORD=

# Admin login
ADMIN_LOGIN_ID=
ADMIN_LOGIN_PASSWORD=
```

Notes:
- `ADMIN_LOGIN_ID` and `ADMIN_LOGIN_PASSWORD` are required for admin sign-in.
- `ADMIN_DELETE_PASSWORD` is required for deleting full course folders from admin interface.
- Resend requires a verified sender domain for production OTP emails. If you use a sender like `gmail.com`, OTP send will fail with 403. Set `RESEND_FROM_EMAIL` to an address on a verified domain in Resend. For testing only, you can use `onboarding@resend.dev`.

## Database Setup (Supabase)

Run the following SQL once in Supabase SQL Editor:

```sql
create table if not exists public.subject_requests (
	id text primary key,
	teacher_id text not null,
	teacher_name text not null,
	teacher_email text not null,
	department text not null,
	subject_name text not null,
	course_code text not null,
	message text,
	status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	drive_folder_id text
);

create index if not exists idx_subject_requests_teacher_id on public.subject_requests (teacher_id);
create index if not exists idx_subject_requests_course_code on public.subject_requests (course_code);
create index if not exists idx_subject_requests_status on public.subject_requests (status);

create table if not exists public.study_files (
	id text primary key,
	name text not null,
	type text not null,
	size bigint not null default 0,
	section text,
	course_code text not null,
	subject_name text not null,
	uploaded_by text not null,
	uploaded_by_name text not null,
	upload_date timestamptz not null default now(),
	drive_file_id text not null,
	drive_download_url text not null,
	drive_thumbnail_url text
);

create index if not exists idx_study_files_course_code on public.study_files (course_code);
create index if not exists idx_study_files_upload_date on public.study_files (upload_date desc);

create table if not exists public.course_sharing (
	course_code text primary key,
	teacher_ids text[] not null default '{}',
	updated_at timestamptz not null default now()
);

create table if not exists public.bug_reports (
	id text primary key,
	reporter_name text not null,
	reporter_email text not null default '',
	reporter_role text not null,
	page_path text,
	message text not null,
	status text not null check (status in ('open', 'triaged', 'resolved')) default 'open',
	admin_note text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_bug_reports_status on public.bug_reports (status);
create index if not exists idx_bug_reports_created_at on public.bug_reports (created_at desc);
```

## Deployment

### Recommended: Vercel

Deploy on Vercel for full functionality (API routes, auth, Drive operations, email).

### GitHub Pages (Static Only)

This project includes API routes under src/app/api, which do not run on GitHub Pages.

The repository provides a static export workflow:

```bash
npm run deploy:gh-pages
```

What works on GitHub Pages:
- Static UI routes

What does not work on GitHub Pages:
- Teacher authentication and registration APIs
- Admin authentication API
- Drive upload/download APIs
- Any backend-only logic

## Project Structure

```txt
src/
	app/
		admin/
		teacher/
		student/
		api/
	components/
	context/
	lib/
scripts/
```

## Troubleshooting

- If Supabase requests fail, verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set exactly.
- If uploads fail with service account quota errors, use Shared Drive configuration and verify Drive env values.
- If dark mode does not react, ensure globals.css keeps the custom dark variant required by Tailwind v4.

## License

This project is intended for educational and institutional use. Add your preferred license before public distribution.
