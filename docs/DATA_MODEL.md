# Data Model

## User (logical shape)

Основная модель пользователя содержит:

- `id`
- `login`
- `name`
- `password` (bcrypt hash)
- `email`
- `gender`
- `profilePhoto`
- `trainingLevel`
- `lastTestScore`
- `trainingPlan`
- `trainingPlanAdaptationHistory`
- `trainingMlFeedbackHistory`
- `scheduledWorkouts`
- `workoutHistory`
- `createdAt`
- `updatedAt`

## Important Collections

- `trainingPlan.sessions[]`
  - упражения, объём (sets/reps/rest), подсказки адаптации.

- `scheduledWorkouts[]`
  - плановые сессии календаря, статусы, время, result link.

- `workoutHistory[]`
  - фактические завершённые/частичные/пропущенные/отменённые тренировки.
  - содержит `exerciseSetWeights[]`.

- `trainingMlFeedbackHistory[]`
  - события для адаптации:
  - `exercise_removed`
  - `exercise_replaced`
  - `exercise_skipped`
  - `sets_decreased`
  - `workout_skipped`
  - `workout_partial`

## Backend Data Catalogs

- `backend/data/exerciseCatalog.js` — каталог упражнений.
- `backend/data/trainingPlanCatalog.js` — библиотека планов и версий.
- `backend/data/questions.js` — вопросы теста.
- `backend/data/gamification/achievements.json` — набор достижений.
- `backend/data/gamification/achievementCatalog.js` — нормализация и экспорт каталога.
