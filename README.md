# WORKOUTSHEDULE

WorkoutSchedule is a fitness planning application with a React/Vite frontend and an Express/MySQL backend. A user passes a fitness test, receives a training level, builds a personalized plan, schedules workouts in a calendar, runs active workout sessions, and tracks progress in statistics.

Current project version: `1.0.4`

## Overview

The project is split into two parts:

- `frontend/` - React, Vite, Tailwind CSS, PWA
- `backend/` - Express, MySQL, JSON fallback

Main user flow:

1. Register and log in with `login + password`.
2. Pass the fitness test.
3. Get `score` and `trainingLevel`.
4. Build or edit a personalized training plan.
5. Schedule workouts in the calendar.
6. Start an active workout on the planned day.
7. Save workout results, weights, and completion data.
8. Let the system adapt future plans based on progress and history.

## Features

- Registration and login
- Profile editing: name, email, password, photo, gender
- Fitness test and training level evaluation
- Personalized plan generation
- Pseudo-ML adaptation of exercise selection and volume
- Workout calendar with planning, completion, cancellation, and time rescheduling
- Active workout runtime with sets, rest timer, and weight tracking
- Workout history and statistics dashboard
- Exercise library
- PWA install prompt and offline basics

## Tech stack

### Frontend

- React 19
- React Router
- Vite 8
- Tailwind CSS 4
- PWA manifest and service worker

### Backend

- Node.js
- Express 5
- MySQL2
- JSON fallback repository

## Project structure

```text
WORKOUTSHEDULE/
|- backend/
|  |- app.js
|  |- index.js
|  |- data/
|  |- db/
|  |- modules/
|  |- repositories/
|  |- services/
|  |- shared/
|  `- sql/
|- frontend/
|  |- public/
|  |- src/
|  |  |- components/
|  |  |- constants/
|  |  |- contexts/
|  |  |- data/
|  |  |- hooks/
|  |  |- pages/
|  |  |- services/
|  |  |- shared/
|  |  `- utils/
|  `- vite.config.js
`- README.md
```

## Key files

### Frontend

- App routes: [frontend/src/App.jsx](./frontend/src/App.jsx)
- Route constants: [frontend/src/constants/routes.js](./frontend/src/constants/routes.js)
- Training constructor: [frontend/src/pages/traningPage/StartTraningPage.jsx](./frontend/src/pages/traningPage/StartTraningPage.jsx)
- Workout plan screen: [frontend/src/pages/WorkoutPlanPage.jsx](./frontend/src/pages/WorkoutPlanPage.jsx)
- Active workout screen: [frontend/src/pages/traningPage/TraningPage.jsx](./frontend/src/pages/traningPage/TraningPage.jsx)
- Calendar page: [frontend/src/pages/Calendare.jsx](./frontend/src/pages/Calendare.jsx)
- Statistics page: [frontend/src/pages/StatisticPage.jsx](./frontend/src/pages/StatisticPage.jsx)
- Exercise library: [frontend/src/pages/LibraryPage.jsx](./frontend/src/pages/LibraryPage.jsx)
- Frontend plan helpers: [frontend/src/shared/trainingPlanBuilder.js](./frontend/src/shared/trainingPlanBuilder.js)
- Active workout helpers: [frontend/src/shared/activeWorkout.js](./frontend/src/shared/activeWorkout.js)
- Frontend stats helpers: [frontend/src/shared/workoutStats.js](./frontend/src/shared/workoutStats.js)

### Backend

- API entrypoint: [backend/app.js](./backend/app.js)
- MySQL connection and migrations: [backend/db/mysqlPool.js](./backend/db/mysqlPool.js)
- SQL schema: [backend/sql/schema.sql](./backend/sql/schema.sql)
- Smart plan builder: [backend/services/smartTrainingPlan.js](./backend/services/smartTrainingPlan.js)
- Exercise ranking: [backend/services/workoutGenerator.js](./backend/services/workoutGenerator.js)
- Adaptive volume: [backend/services/adaptiveVolume.js](./backend/services/adaptiveVolume.js)
- Training level evaluator: [backend/services/trainingLevelEvaluator.js](./backend/services/trainingLevelEvaluator.js)
- Feature builder for future ML: [backend/services/trainingFeatureBuilder.js](./backend/services/trainingFeatureBuilder.js)
- ML feedback labels: [backend/services/trainingMlFeedback.js](./backend/services/trainingMlFeedback.js)
- Adaptation history: [backend/services/trainingPlanAdaptationHistory.js](./backend/services/trainingPlanAdaptationHistory.js)
- Training plan catalog: [backend/data/trainingPlanCatalog.js](./backend/data/trainingPlanCatalog.js)
- Exercise catalog: [backend/data/exerciseCatalog.js](./backend/data/exerciseCatalog.js)

## Data model

### User

The current user model includes:

- `login`
- `name`
- `password`
- `email`
- `profilePhoto`
- `gender`
- `trainingLevel`
- `lastTestScore`
- `trainingPlan`
- `trainingPlanAdaptationHistory`
- `trainingMlFeedbackHistory`
- `scheduledWorkouts`
- `workoutHistory`

### Training plan

A training plan contains:

- `focusKey`
- `focusLabel`
- `workoutsPerWeek`
- `sessions`
- exercise prescriptions
- sets, rep ranges, rest
- adaptation hints
- version metadata

### Workout history

Workout history entries may include:

- status
- scheduled date and time
- actual duration
- planned duration
- completed exercises
- completed sets
- set weights
- calories
- body weight
- subjective metrics such as energy and effort

## Pseudo-ML adaptation

The project does not use a trained neural model yet. Instead, it uses a rule-based recommendation system that already behaves like a lightweight ML layer.

Current capabilities:

- evaluate training level from test results
- normalize profile and workout history into features
- rank exercises based on level, goal, equipment, body part, history, and adaptation signals
- adapt sets, rest, and rep ranges based on recent performance
- store manual feedback labels for future ML training

Current feedback labels include:

- `exercise_removed`
- `exercise_replaced`
- `sets_decreased`
- `workout_skipped`
- `workout_partial`

This gives the project a stable path toward a future learned ranker or inference service without rewriting the API contract.

## API

### Health and misc

- `GET /api/health`
- `GET /api/exercises`

### Authentication and profile

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users/:id`
- `PATCH /api/users/:id/profile`

### Test and training level

- `PATCH /api/users/:id/training-result`
- `POST /api/users/:id/evaluate-training-level`

### Training plans

- `PUT /api/users/:id/training-plan`
- `POST /api/workouts/smart`
- `POST /api/workouts/smart-plan`
- `POST /api/users/:id/training-feedback`

### Calendar and workouts

- `POST /api/users/:id/scheduled-workouts`
- `PATCH /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `DELETE /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/skip`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete`

### Statistics

- `GET /api/users/:id/stats`

## Local development

### Requirements

- Node.js 20+
- npm 10+
- MySQL 8+ or MariaDB

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Example `backend/.env`:

```env
API_PORT=3001
SERVER_DB_PROVIDER=auto
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=workoutshedule
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
cd frontend
npm run build
```

## MySQL and JSON fallback

The backend works through repository abstractions. If MySQL is unavailable, the app can fall back to JSON storage for development and recovery scenarios.

Notes:

- MySQL is the primary production storage.
- JSON fallback is useful for local development.
- The frontend production build no longer bundles the mock provider.

## PWA

The frontend is prepared as a Progressive Web App.

Included:

- manifest
- service worker
- offline page
- install prompt logic

Relevant files:

- [frontend/public/manifest.webmanifest](./frontend/public/manifest.webmanifest)
- [frontend/public/sw.js](./frontend/public/sw.js)
- [frontend/public/offline.html](./frontend/public/offline.html)
- [frontend/src/utils/registerServiceWorker.js](./frontend/src/utils/registerServiceWorker.js)
- [frontend/src/hooks/useInstallPrompt.js](./frontend/src/hooks/useInstallPrompt.js)

## Ubuntu deployment

Typical deployment flow:

### 1. Update code

```bash
git pull
```

### 2. Install backend dependencies

```bash
cd backend
npm ci
```

### 3. Install and build frontend

```bash
cd ../frontend
npm ci
npm run build
```

### 4. Start backend

```bash
cd ../backend
npm start
```

If you use PM2:

```bash
pm2 start index.js --name workoutshedule-api
pm2 save
```

## Current product areas

- auth and profile
- test and level evaluation
- personalized plan generation
- active workouts
- calendar and scheduling
- statistics
- exercise library
- adaptive systems

## Known notes

- The project uses pseudo-ML adaptation, not a trained model yet.
- Windows-specific Vite/Tailwind issues were handled in frontend scripts via `--configLoader native`.
- A license file has not been added yet.

## Roadmap

- richer statistics redesign
- better exercise search and filters in the library
- deeper adaptation based on recovery metrics
- explicit plan history comparison
- optional real ML re-ranking layer
