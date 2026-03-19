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

# Google Drive integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_MASTER_FOLDER_ID=
GOOGLE_DRIVE_SHARED_DRIVE_ID=
GOOGLE_DRIVE_DELEGATED_USER_EMAIL=
```
