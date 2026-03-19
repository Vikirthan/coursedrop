# CourseDrop

CourseDrop is a Next.js app for managing course materials with roles for students, teachers, and admin.

## Local Development

Install dependencies and run:

```bash
npm install
npm run dev
```

Local URL:

```txt
http://localhost:3000
```

## Admin Login (Demo)

Admin login in this project currently uses client-side demo credentials:

```txt
Admin ID: 12307334
Password: Vikirthan@819
```

## GitHub Pages Deployment

This repo is configured with npm scripts to publish a static build to the `gh-pages` branch.

Use:

```bash
npm run deploy:gh-pages
```

or:

```bash
npm run deploy
```

After push, enable GitHub Pages in repository settings:

1. Open Settings -> Pages.
2. Set Source to Deploy from a branch.
3. Select `gh-pages` branch and `/ (root)`.
4. Save.

## Important Hosting Note

GitHub Pages only serves static files. This project also has Next.js API routes under `src/app/api/*`.

That means on GitHub Pages:

- Teacher registration/login APIs will not run.
- Drive upload/download APIs will not run.
- Any backend-only feature will not work.

For full functionality (APIs + auth + Drive), deploy to a server platform such as Vercel.

## Required Environment Variables (Vercel)

Set these in your Vercel Project Settings -> Environment Variables, then redeploy.

```txt
# Supabase (required for auth data)
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=

# OTP email delivery (required for forgot password)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
# Optional display name in email subject
APP_NAME=CourseDrop

# Google Drive integration (choose one auth mode)
# Mode A (personal Gmail): OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=

# Mode B (service account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_DELEGATED_USER_EMAIL=

# Required in both modes (folder/root to store course folders)
GOOGLE_DRIVE_MASTER_FOLDER_ID=
# Optional fallback root (Shared Drive root)
GOOGLE_DRIVE_SHARED_DRIVE_ID=

# Optional admin hardening
ADMIN_DELETE_PASSWORD=
```

## Supabase Tables Required For Cross-Device Sync

Run this once in Supabase SQL Editor so requests, files, sharing, and bug reports are shared across devices.

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
