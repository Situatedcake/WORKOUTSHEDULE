# API Reference (Current)

Базовый префикс: `/api`

## Service

- `GET /api/health`
- `GET /api/exercises`
- `GET /api/training/config`
- `GET /api/testing/questions`
- `GET /api/gamification/catalog`

## Auth / User

- `POST /api/auth/login`
  - body: `{ login, password }`
  - response: `{ user }`

- `POST /api/auth/register`
  - body: `{ login, password }`
  - response: `{ user }`

- `GET /api/users/:id`
  - response: `{ user }`

- `PATCH /api/users/:id/profile`
  - body: `{ name?, email?, gender?, password?, profilePhoto? }`
  - response: `{ user }`

## Training / Tasting

- `PATCH /api/users/:id/training-result`
  - body: `{ score, trainingLevel? }`
  - response: `{ user }`

- `POST /api/users/:id/evaluate-training-level`
  - body: tasting payload + optional plan params
  - response: `{ evaluation, trainingPlan?, user }`

- `POST /api/users/:id/training-feedback`
  - body: `{ events: TrainingFeedbackEvent[] }`
  - response: `{ user }`

- `PUT /api/users/:id/training-plan`
  - body: plan generation/update payload
  - response: `{ user, adaptationSummary?, ... }`

## Scheduled Workouts / Calendar

- `POST /api/users/:id/scheduled-workouts`
- `PATCH /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `DELETE /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/skip`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete`

`/complete` принимает расширенный payload:

- `status`
- `startedAt`
- `durationSeconds`
- `plannedDurationSeconds`
- `completedExercisesCount`
- `completedSetsCount`
- `exerciseSetWeights`
- `weightKg`
- `burnedCalories`
- `energyLevel`
- `effortLevel`
- `sleepQuality`

## Stats

- `GET /api/users/:id/stats?range=7|30|all`
  - response: `{ stats }`
  - включает:
    - status breakdown
    - load/progress/adaptation trends
    - top exercises by weight
    - top skipped exercises

## Plan Generation

- `POST /api/workouts/smart`
- `POST /api/workouts/smart-plan`
- `POST /api/workouts/basic-plan`
- `POST /generate-smart-workout` (legacy)
