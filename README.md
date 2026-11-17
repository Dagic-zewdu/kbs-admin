# KBS Cosmetics Admin

Back office for the KBS Cosmetics store, built with **Next.js (App Router), Redux Toolkit + RTK Query, react-hook-form + zod and Tailwind CSS**.

| Branch | URL | Talks to |
| ------ | --- | -------- |
| `dev`  | https://dev.admin.kbscosmetics.com | https://dev.api.kbscosmetics.com |
| `main` | https://admin.kbscosmetics.com | https://api.kbscosmetics.com |

Every push to `dev` or `main` is linted, built into a Docker image, pushed to GHCR and deployed to the VPS (see `.github/workflows/deploy.yml`).

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000, uses the DEV API by default
```

To use a backend on your machine, create `.env.development.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Environment files

| File | Used by |
| ---- | ------- |
| `.env.development` | `npm run dev` |
| `.env.dev` | Docker image built from the `dev` branch |
| `.env.prod` | Docker image built from the `main` branch |

They only hold public values (`NEXT_PUBLIC_*` is visible in the browser). Never put secrets in them.

## Project structure

```
src/
  app/
    (auth)/          login, signup, forgot-password, reset-password (guests only)
    (dashboard)/     pages behind login, with the sidebar + top bar
  components/
    auth/            AuthGuard / GuestGuard
    layout/          Sidebar, Topbar, nav-items.ts (add menu entries here)
    dashboard/       dashboard widgets
    ui/              Button, Input, Alert, ...
  config/env.ts      API URL and environment name
  store/
    index.ts         Redux store
    slices/          auth + ui state
    api/             RTK Query endpoints (base-api.ts adds the Bearer token)
  validations/       zod schemas for the forms
```

### Adding a page

1. Create `src/app/(dashboard)/products/page.tsx`.
2. Add endpoints with `baseApi.injectEndpoints` in `src/store/api/`.
3. Remove `comingSoon: true` from its entry in `src/components/layout/nav-items.ts`.

## Accounts

The first account created through **Sign up** becomes the super admin. Later sign-ups are created inactive and need approval.
