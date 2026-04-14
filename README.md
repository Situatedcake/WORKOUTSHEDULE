# WORKOUTSHEDULE

WorkoutSchedule — веб-приложение для подбора, планирования и выполнения тренировок.

Проект состоит из:

- `frontend/` — React + Vite + Tailwind CSS
- `backend/` — Node.js + Express + MySQL (с fallback на JSON)

Текущая версия: `1.0.7`

## Что умеет проект

- Регистрация и вход по `login + password`
- Профиль пользователя (имя, email, пол, пароль, фото)
- Тест уровня подготовки и расчет `score/trainingLevel`
- Генерация персонального тренировочного плана
- Конструктор тренировок с ручными правками
- Календарь: планирование, перенос, отмена, пропуск, завершение
- Активная тренировка: подходы, веса, таймеры, фиксация результата
- Статистика тренировок и прогресса
- Рейтинг и достижения (gamification)
- Библиотека упражнений
- PWA (manifest + offline)

## Архитектура

### Frontend

- React 19
- React Router 7
- Vite 8
- Tailwind CSS 4

Ключевые папки:

- `frontend/src/pages` — страницы приложения
- `frontend/src/components` — UI-компоненты
- `frontend/src/services/database` — API/mock слой хранилища
- `frontend/src/shared` — бизнес-логика (план, статистика, адаптация)

### Backend

- Node.js (ESM)
- Express 5
- mysql2
- dotenv

Ключевые папки:

- `backend/app.js` — все API-роуты
- `backend/repositories` — репозитории (MySQL/JSON)
- `backend/services` — логика адаптации, статистики, gamification
- `backend/data` — каталоги упражнений, планов, вопросов, достижений
- `backend/sql/schema.sql` — схема MySQL

## API (актуальные роуты)

### Сервисные

- `GET /api/health`
- `GET /api/exercises`
- `GET /api/training/config`
- `GET /api/testing/questions`
- `GET /api/gamification/catalog`

### Пользователь и авторизация

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/:id`
- `PATCH /api/users/:id/profile`

### Тест и план

- `PATCH /api/users/:id/training-result`
- `POST /api/users/:id/evaluate-training-level`
- `PUT /api/users/:id/training-plan`
- `POST /api/users/:id/training-feedback`

### Календарь и тренировки

- `POST /api/users/:id/scheduled-workouts`
- `PATCH /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `DELETE /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/skip`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete`
- `GET /api/users/:id/stats`

### Генерация тренировок

- `POST /api/workouts/smart`
- `POST /api/workouts/smart-plan`
- `POST /api/workouts/basic-plan`
- `POST /generate-smart-workout`

## Достижения (gamification)

Основной файл каталога:

- `backend/data/gamification/achievements.json`

Фронтенд подтягивает каталог через:

- `GET /api/gamification/catalog`

И комбинирует его с пользовательскими метриками (`gamification.metrics`) для отображения прогресса/анлоков.

## Запуск локально

## Требования

- Node.js 20+
- npm 10+
- MySQL 8+ (опционально, если не используете JSON fallback)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Продакшен-сборка frontend

```bash
cd frontend
npm run build
```

## Конфигурация backend

Файл: `backend/.env`

Основные переменные:

- `API_PORT`
- `SERVER_DB_PROVIDER` = `mysql | json | auto`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

## Проверка состояния (выполнено)

Проверки, выполненные в этом состоянии проекта:

- Полный smoke-test API: `25/25` роутов успешно (`2xx`) на локальном сервере
- `frontend`: `npm run lint` — успешно
- `frontend`: `npm run build` — успешно
- Зависимости:
  - `backend`: корректные
  - `frontend`: рабочие, но `npm ls` показывает несколько `extraneous` wasm-пакетов в окружении (на работу сборки не влияет)

## Деплой (Ubuntu)

```bash
git pull
cd backend && npm ci
cd ../frontend && npm ci && npm run build
cd ../backend && npm start
```

Пример с PM2:

```bash
pm2 start index.js --name workoutshedule-api
pm2 save
```

## Примечания

- В проекте используется rule-based “псевдо-ML” адаптация (без полноценной обученной ML-модели).
- Для корректного отображения новых достижений обновляйте `backend/data/gamification/achievements.json` и перезапускайте backend.
