# WORKOUTSHEDULE

Полноценное веб/PWA-приложение для тестирования уровня подготовки, генерации персонального плана тренировок, ведения календаря, выполнения тренировок, аналитики прогресса и геймификации (рейтинг + достижения).

Актуально для состояния репозитория на **22 апреля 2026**.

Текущая версия (по `frontend/package.json` и `backend/package.json`): **1.0.9**.

## 1. Что умеет проект сейчас

### 1.1 Авторизация и профиль

- Регистрация и вход по `login + password`.
- При регистрации `name` по умолчанию = `login` (дальше меняется в профиле).
- Профиль: имя, email, пол (`male/female/not_specified`), пароль, фото.
- Сессия хранится на фронте через `sessionStorage`.

### 1.2 Тестирование (tasting)

- Отдельный backend-feature модуль для теста уровня.
- Оценка по payload:
  - `experienceYears`
  - `workoutsPerWeek`
  - `pushups`
  - `pullups`
  - `plankSeconds`
- Возврат:
  - `score`
  - `trainingLevel`: `Начинающий | Средний | Продвинутый`
- На frontend вынесено в отдельный feature-каталог `src/features/tasting`.

### 1.3 Построение тренировочного плана

- Базовый builder: `backend/shared/trainingPlanBuilder.js`.
- Smart-план: `backend/services/smartTrainingPlan.js` (rule-based псевдо-ML адаптация).
- Поддержка:
  - `focusKey`
  - `workoutsPerWeek`
  - `sessionSelections`
  - 3 базовые программы из `trainingPlanCatalog`:
    - `full-body-unified`
    - `arms-unified`
    - `cardio-unified`
  - версии программ по дням (`2_days`, `3_days`, `4_days`, `5_days`) с автоматическим выбором под `workoutsPerWeek`
  - адаптация объёма упражнения (подходы/повторы/отдых)
  - адаптация состава упражнений
  - история ручных изменений плана
- При ошибке smart-подбора есть fallback на базовый builder.

### 1.4 Календарь тренировок

- Добавление тренировки на дату/время.
- Перенос (reschedule) по правилам календаря.
- Отмена.
- Пропуск.
- Завершение.
- Автосинхронизация просроченных тренировок (в skipped) на backend.
- Отображение статусов дней в календаре.

### 1.5 Активная тренировка

- Запуск сессии по запланированной тренировке.
- Работа с упражнениями:
  - замена упражнения,
  - добавление упражнения,
  - удаление упражнения,
  - изменение количества подходов.
- Учёт веса по подходам (`exerciseSetWeights`).
- Завершение с расширенным payload:
  - duration/plannedDuration/startAt/status
  - completedExercisesCount/completedSetsCount
  - exerciseSetWeights
  - weightKg/burnedCalories/energyLevel/effortLevel/sleepQuality

### 1.6 Статистика и аналитика

- Сводные метрики по истории тренировок.
- Тренды/графики:
  - адаптация
  - нагрузка
  - прогресс
- Поддержка range-фильтра (`all`, `7`, `30` дней).
- Блок причин адаптации плана (адаптационные подсказки и summary).

### 1.7 Геймификация

- Рейтинг с tier-системой.
- Каталог достижений из JSON.
- Редкости/сложности/прогресс.
- Метрики для анлоков и score.
- Celebration-слой на frontend.

### 1.8 PWA и UX

- Manifest + Service Worker + offline fallback (`offline.html`).
- Установка приложения через `beforeinstallprompt`.
- Детект standalone режима.
- Выбор темы (dark/light).
- Code-splitting по route-страницам (`React.lazy` + `Suspense`).
- Экран загрузки приложения и маршрутные loading-состояния.
- Обновленная библиотека упражнений: прод-UI, поиск, фильтры, группировка по зонам, раскрывающиеся карточки.

## 2. Технологии

### Frontend

- React 19
- React Router 7
- Vite 8
- Tailwind CSS 4
- ESLint 9

### Backend

- Node.js (ESM)
- Express 5
- mysql2
- dotenv
- nodemon (dev)

## 3. Архитектура хранилища данных

Backend поддерживает провайдеры:

- `mysql` — основной режим.
- `json` — fallback.
- `auto` — пытается MySQL, при неуспехе переключается на JSON.

Конфигурация: `backend/config.js`, переменная `SERVER_DB_PROVIDER`.

### MySQL

- Пул и автоинициализация схемы: `backend/db/mysqlPool.js`.
- Совместимость схемы (миграционный слой) поддерживается в runtime.

### JSON fallback

- Данные: `src/data/mockDatabase.json`.
- Репозиторий: `backend/repositories/jsonUserRepository.js`.

## 4. API (полный список актуальных роутов)

### Сервисные

- `GET /api/health`
- `GET /api/exercises`
- `GET /api/training/config`
- `GET /api/testing/questions`
- `GET /api/gamification/catalog`

### Пользователь и auth

- `GET /api/users/:id`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `PATCH /api/users/:id/profile`

### Тест/уровень/план

- `PATCH /api/users/:id/training-result`
- `POST /api/users/:id/training-feedback`
- `POST /api/users/:id/evaluate-training-level`
- `PUT /api/users/:id/training-plan`

### Календарь и выполнение

- `POST /api/users/:id/scheduled-workouts`
- `PATCH /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `DELETE /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/skip`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete`

### Статистика

- `GET /api/users/:id/stats`

### Генерация тренировок

- `POST /api/workouts/smart`
- `POST /api/workouts/smart-plan`
- `POST /api/workouts/basic-plan`
- `POST /generate-smart-workout` (legacy-compatible endpoint)

## 5. Frontend маршруты

Определены в `frontend/src/constants/routes.js`:

- `/`
- `/login`
- `/register`
- `/Start-traning`
- `/create-training`
- `/stats`
- `/user`
- `/user/edit`
- `/user/achievements`
- `/calendare`
- `/library`
- `/training/plan`
- `/training/active`
- `/training/finish`
- `/training/history`
- `/start-tasting`
- `/tasting`
- `/tasting/finish`

## 6. Данные и каталоги

Основные редактируемые data-файлы backend:

- `backend/data/exerciseCatalog.js` — каталог упражнений.
- `backend/data/trainingPlanCatalog.js` — библиотека планов (3 базовые программы + версии по дням `2_days..5_days` и резолверы версий).
- `backend/data/questions.js` — вопросы теста (training/tasting).
- `backend/data/gamification/achievements.json` — источник достижений.
- `backend/data/gamification/achievementCatalog.js` — нормализованный каталог достижений.

Дополнительно:

- `backend/data/README.md` описывает назначение data-слоя.

## 7. Модель пользователя (ключевые поля)

- `id`
- `login`
- `name`
- `password`
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

## 8. Запуск локально

## 8.1 Требования

- Node.js 20+
- npm 10+
- MySQL 8+ (если режим `mysql`/`auto`)

## 8.2 Backend

```bash
cd backend
npm install
npm run dev
```

## 8.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

## 8.4 Production build frontend

```bash
cd frontend
npm run build
```

## 8.5 Backend production run

```bash
cd backend
npm start
```

## 9. Переменные окружения backend

Файл: `backend/.env`

Шаблон: `backend/.env.example`

Доступные переменные:

- `API_PORT`
- `SERVER_DB_PROVIDER` (`auto | mysql | json`)
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

## 10. PWA

Файлы:

- `frontend/public/manifest.webmanifest`
- `frontend/public/sw.js`
- `frontend/public/offline.html`
- `frontend/src/utils/registerServiceWorker.js`
- `frontend/src/hooks/useInstallPrompt.js`

Реализовано:

- app shell caching
- runtime caching
- offline fallback для навигации
- установка PWA через стандартный prompt
- iOS Safari install hints

## 11. Theme system

Файлы:

- `frontend/src/contexts/ThemeContext.jsx`
- `frontend/src/contexts/themeContextObject.js`
- `frontend/src/hooks/useTheme.js`
- `frontend/src/shared/themeIcons.js`

Поведение:

- Тема хранится в `localStorage` (`workoutshedule-theme`).
- На `<html>` проставляются `data-theme` и `color-scheme`.
- Поддерживаются `dark` и `light`.

## 12. Ограничения и важные замечания

- Пароли хранятся в виде `bcrypt`-хеша (`bcryptjs`).
- Для старых пользователей с legacy plain password включена мягкая миграция: при успешном входе пароль автоматически перехешируется.
- Есть legacy-роут `/generate-smart-workout`.
- В репозитории есть одновременно:
  - `backend/services/trainingLevelEvaluator.js`
  - `backend/features/tasting/services/trainingLevelEvaluator.js`
    В `app.js` используется версия из `features/tasting/services`.
- Части UI-текста в некоторых файлах могут отображаться в терминале в неправильной кодировке, но исходники файлов при этом рабочие.

## 13. Полная карта экспортируемых функций/констант (по коду)

Ниже перечислены **экспортируемые** API сущности модулей (актуальный срез по `export`).

### Backend

- `backend/app.js`: `createServerApp`
- `backend/config.js`: `serverConfig`
- `backend/db/mysqlPool.js`: `getMySqlPool`
- `backend/features/tasting/data/questions.js`: `questions`
- `backend/features/tasting/services/questionsPayload.js`: `buildTastingQuestionsPayload`
- `backend/features/tasting/services/scoreModel.js`: `buildTastingScoreModel`, `estimateTastingDurationMinutes`, `getTrainingLevelByTestScore`
- `backend/features/tasting/services/trainingLevelEvaluator.js`: `validateTrainingLevelPayload`, `evaluateTrainingLevel`
- `backend/data/exerciseCatalog.js`: `exerciseCatalog`
- `backend/data/trainingPlanCatalog.js`: `TRAINING_PLAN_LIBRARY`, `normalizeWorkoutsPerWeekValue`, `getPlanVersionKey`, `getPlanVersion`, `getPlanSessions`
- `backend/data/gamification/achievementCatalog.js`: `ACHIEVEMENT_DIFFICULTIES`, `ACHIEVEMENT_CATALOG`
- `backend/modules/userProfile.js`: `buildUserProfile`, `vectorizeProfile`
- `backend/repositories/jsonUserRepository.js`: `jsonUserRepository`
- `backend/repositories/mysqlUserRepository.js`: `mysqlUserRepository`
- `backend/services/adaptiveSignals.js`: `buildAdaptiveSignals`, `buildAdaptationSummary`
- `backend/services/adaptiveVolume.js`: `buildAdaptiveExerciseVolume`
- `backend/services/exerciseCatalogUtils.js`: `normalizeArray`, `normalizeTag`, `normalizeTagArray`, `hasTagIntersection`, `normalizeEquipment`
- `backend/services/expiredScheduledWorkouts.js`: `isScheduledWorkoutExpired`, `syncExpiredScheduledWorkouts`
- `backend/services/gamification.js`: `buildUserGamificationSnapshot`, `attachGamificationSnapshot`
- `backend/services/smartTrainingPlan.js`: `generateSmartTrainingPlan`
- `backend/services/trainingData.js`: `WORKOUTS_PER_WEEK_OPTIONS`, `getTrainingGoals`, `getTrainingSuggestedSetup`, `buildTrainingConfigPayload`
- `backend/services/trainingFeatureBuilder.js`: `buildTrainingFeatures`
- `backend/services/trainingMlFeedback.js`: `normalizeTrainingMlFeedbackEntry`, `normalizeTrainingMlFeedbackHistory`, `createTrainingMlFeedbackEntry`, `buildWorkoutOutcomeFeedbackEvents`
- `backend/services/trainingPlanAdaptationHistory.js`: `buildTrainingPlanVolumeBreakdown`, `normalizeTrainingPlanAdaptationEvent`, `normalizeTrainingPlanAdaptationHistory`, `annotateManualTrainingPlanChanges`, `buildManualTrainingPlanAdaptationSummary`, `createTrainingPlanAdaptationEvent`
- `backend/services/workoutGenerator.js`: `generateWorkoutAdvanced`
- `backend/services/workoutHistory.js`: `isProductiveWorkoutStatus`, `normalizeWorkoutHistoryEntry`, `createWorkoutHistoryEntry`, `normalizeWorkoutHistory`
- `backend/services/workoutStats.js`: `buildWorkoutStatsPayload`
- `backend/shared/activeWorkout.js`: `REST_DURATION_SECONDS`, `getExerciseDifficultyLabel`, `decorateWorkoutExercises`, `calculateWorkoutTotals`, `buildWorkoutDraft`, `replaceWorkoutExercise`, `removeWorkoutExercise`, `updateWorkoutExerciseSets`, `formatDuration`
- `backend/shared/workoutSchedule.js`: `DEFAULT_WORKOUT_TIME`, `formatDateKey`, `getMonthDays`, `formatWorkoutRelativeLabel`, `getNearestScheduledWorkout`, `rebalanceScheduledWorkouts`, `scheduleWorkout`, `rescheduleWorkout`, `cancelWorkout`
- `backend/shared/trainingPlanBuilder.js`: `WORKOUTS_PER_WEEK_OPTIONS`, `EXERCISES_PER_SESSION`, `TRAINING_GOALS`, `formatExercisePrescription`, `getLevelConfig`, `resolveTemplateExerciseType`, `getExercisePrescriptionDetails`, `getExercisePrescription`, `createTrainingPlanDraft`, `buildTrainingPlan`
- `backend/jsonDatabase.js`: `normalizeUserName`, `createUserId`, `sanitizeUser`
- `backend/mockDatabaseApiPlugin.js`: `mockDatabaseApiPlugin`

### Frontend

- `frontend/src/constants/routes.js`: `ROUTES`
- `frontend/src/hooks/useTheme.js`: `useTheme`
- `frontend/src/hooks/useInstallPrompt.js`: `useInstallPrompt`
- `frontend/src/hooks/useAuth.js`: `useAuth`
- `frontend/src/contexts/ThemeContext.jsx`: `ThemeProvider`
- `frontend/src/contexts/AuthContext.jsx`: `AuthProvider`
- `frontend/src/contexts/themeContextObject.js`: `ThemeContext`
- `frontend/src/contexts/authContextObject.js`: `AuthContext`
- `frontend/src/utils/authSession.js`: `getSessionUserId`, `setSessionUserId`, `clearSessionUserId`
- `frontend/src/utils/activeWorkoutSession.js`: `getActiveWorkoutDraft`, `saveActiveWorkoutDraft`, `clearActiveWorkoutDraft`, `getActiveWorkoutRuntime`, `saveActiveWorkoutRuntime`, `clearActiveWorkoutRuntime`, `hasActiveWorkoutInProgress`, `getActiveWorkoutResultDraft`, `saveActiveWorkoutResultDraft`, `clearActiveWorkoutResultDraft`, `clearEntireActiveWorkoutSession`
- `frontend/src/utils/registerServiceWorker.js`: `registerServiceWorker`
- `frontend/src/utils/celebrationHaptics.js`: `playCelebrationHaptics`
- `frontend/src/utils/gamificationCelebrationSession.js`: `markGamificationCelebrationShown`, `wasGamificationCelebrationShownRecently`
- `frontend/src/features/tasting/utils/session.js`: `hasStartedTasting`, `startTastingSession`, `clearTastingStart`, `saveTastingScore`, `getTastingScore`, `saveTastingScoreModel`, `getTastingScoreModel`, `saveTastingQuestionsMeta`, `getTastingQuestionsMeta`
- `frontend/src/features/tasting/utils/trainingLevel.js`: `normalizeTrainingScoreModel`, `getTrainingLevelByScore`
- `frontend/src/components/LoadingCard.jsx`: `LoadingBars`, `LoadingOrb`
- `frontend/src/components/StatsCharts.jsx`: `BarTrendChart`, `LineTrendChart`, `AdaptationTrendChart`
- `frontend/src/services/database/databaseConfig.js`: `DATABASE_CONFIG`
- `frontend/src/services/database/databaseContracts.js`: `USER_STORAGE_METHODS`
- `frontend/src/services/database/apiUserStorage.js`: `apiUserStorage`
- `frontend/src/services/database/mockUserStorage.js`: `mockUserStorage`
- `frontend/src/services/database/mockTrainingPlanBuilder.js`: `buildTrainingPlan`
- `frontend/src/services/database/userRepository.js`: `userRepository`
- `frontend/src/shared/activeWorkout.js`: `REST_DURATION_SECONDS`, `getExerciseDifficultyLabel`, `decorateWorkoutExercises`, `calculateWorkoutTotals`, `buildWorkoutDraft`, `replaceWorkoutExercise`, `getAddableWorkoutExerciseOptions`, `addWorkoutExercise`, `removeWorkoutExercise`, `updateWorkoutExerciseSets`, `formatDuration`
- `frontend/src/shared/gamificationCelebration.js`: `CELEBRATION_TOAST_DURATION_MS`, `getCelebrationTimeout`
- `frontend/src/shared/gamificationUi.js`: `getTierMeta`, `getRarityMeta`, `getAchievementDifficultyMeta`, `getMomentumMeta`
- `frontend/src/shared/liveWorkoutAchievements.js`: `getUnlockedAchievementIds`, `buildLiveWorkoutAchievementUnlocks`
- `frontend/src/shared/themeIcons.js`: `getThemeIcon`
- `frontend/src/shared/trainingMlFeedback.js`: `createTrainingFeedbackEvent`
- `frontend/src/shared/trainingPlanBuilder.js`: `WORKOUTS_PER_WEEK_OPTIONS`, `EXERCISES_PER_SESSION`, `formatExercisePrescription`, `getExerciseVolumeReason`, `getExerciseVolumeReasonTitle`, `getExercisePrescriptionDetails`, `getExercisePrescription`, `getExerciseVolumeChangeChips`, `getExerciseVolumeReasonMeta`, `getTrainingPlanAdaptationHighlights`, `getTrainingPlanAdaptationBreakdown`
- `frontend/src/shared/workoutSchedule.js`: `DEFAULT_WORKOUT_TIME`, `formatDateKey`, `getMonthDays`, `formatWorkoutRelativeLabel`, `getNearestScheduledWorkout`, `rebalanceScheduledWorkouts`, `scheduleWorkout`, `rescheduleWorkout`, `cancelWorkout`
- `frontend/src/shared/workoutStats.js`: `getTrackedWeightValues`, `calculateWorkoutTrackedWeight`, `getLatestRecordedWeight`, `getPersonalBestSetWeight`, `getTrackedSetCount`, `getAverageWorkoutDurationMinutes`, `getWorkoutStreakDays`, `getTopExercisesByTrackedWeight`, `buildWorkoutStats`

## 14. Рекомендуемые следующие шаги

- Добавить принудительную миграцию всех legacy plain password в фоне (batch), чтобы не ждать первого логина.
- Добавить JWT/refresh-схему вместо сессионного userId в storage.
- Вынести OpenAPI/Swagger описание на основе текущих роутов.
- Добавить автоматические тесты:
  - unit для adaptive/gamification logic,
  - integration для ключевых API роутов,
  - e2e smoke для критических flow.
- Ввести версионирование API (`/api/v1`).

## 15. Структура проекта

```text
WORKOUTSHEDULE/
├─ backend/
│  ├─ data/
│  │  ├─ gamification/
│  │  │  ├─ achievements.json
│  │  │  └─ achievementCatalog.js
│  │  ├─ exerciseCatalog.js
│  │  ├─ questions.js
│  │  ├─ trainingPlanCatalog.js
│  │  └─ README.md
│  ├─ db/
│  │  └─ mysqlPool.js
│  ├─ features/
│  │  └─ tasting/
│  │     ├─ data/
│  │     └─ services/
│  ├─ modules/
│  │  └─ userProfile.js
│  ├─ repositories/
│  │  ├─ jsonUserRepository.js
│  │  └─ mysqlUserRepository.js
│  ├─ services/
│  │  ├─ gamification.js
│  │  ├─ smartTrainingPlan.js
│  │  ├─ workoutGenerator.js
│  │  ├─ workoutHistory.js
│  │  └─ workoutStats.js
│  ├─ shared/
│  │  ├─ activeWorkout.js
│  │  ├─ trainingPlanBuilder.js
│  │  └─ workoutSchedule.js
│  ├─ sql/
│  │  └─ schema.sql
│  ├─ src/
│  │  └─ data/
│  │     └─ mockDatabase.json
│  ├─ app.js
│  ├─ index.js
│  ├─ jsonDatabase.js
│  ├─ package.json
│  └─ package-lock.json
├─ frontend/
│  ├─ public/
│  │  ├─ icons/
│  │  ├─ manifest.webmanifest
│  │  ├─ offline.html
│  │  └─ sw.js
│  ├─ src/
│  │  ├─ components/
│  │  ├─ constants/
│  │  ├─ contexts/
│  │  ├─ data/
│  │  ├─ features/
│  │  │  └─ tasting/
│  │  ├─ hooks/
│  │  ├─ pages/
│  │  ├─ services/
│  │  │  └─ database/
│  │  ├─ shared/
│  │  ├─ utils/
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ vite.config.js
│  ├─ package.json
│  └─ package-lock.json
├─ src/                           # legacy/shared root-level code (если используется)
├─ .gitignore
└─ README.md
```

## 16. Документация

Подробная документация вынесена в каталог `docs/`:

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/ML_ADAPTATION.md`
- `docs/BACKEND.md`
- `docs/FRONTEND.md`
- `docs/CODE_COMMENTING_POLICY.md`
