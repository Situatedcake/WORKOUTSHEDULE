# Frontend Guide

## Tech

- React 19
- React Router 7
- Vite
- Tailwind CSS

## Core Structure

- `frontend/src/pages/` — route pages.
- `frontend/src/components/` — reusable UI.
- `frontend/src/contexts/` — Auth/Theme providers.
- `frontend/src/hooks/` — custom hooks.
- `frontend/src/services/database/` — API adapter + mock adapter.
- `frontend/src/shared/` — shared domain calculations.
- `frontend/src/utils/` — session/pwa/helper utilities.

## Key User Flows

- Auth: `AuthContext` + login/register pages.
- Training start/edit: `pages/traningPage/StartTraningPage.jsx`.
- Active workout: `pages/traningPage/TraningPage.jsx`.
- Finish workout: `pages/traningPage/FinishTrainingPage.jsx`.
- Statistics: `pages/StatisticPage.jsx`.

## Data Access Strategy

Все операции идут через `userRepository`, который переключается между:

- API storage
- mock storage

Это позволяет не дублировать UI-логику для разных бэкенд-режимов.

## PWA

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
