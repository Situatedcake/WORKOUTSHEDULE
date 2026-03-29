# WORKOUTSHEDULE

Приложение для подбора, планирования и сопровождения тренировок. Пользователь проходит тест на уровень подготовки, получает персональный тренировочный план, планирует занятия в календаре, проходит активную тренировку, а система постепенно адаптирует программу под его прогресс.

Проект разделён на две части:

- `frontend/` — React + Vite + Tailwind CSS + PWA
- `backend/` — Express + MySQL с JSON fallback

## Что уже умеет проект

### Пользовательский сценарий

1. Пользователь регистрируется и входит по `логину + паролю`.
2. Проходит тест на уровень подготовки.
3. Получает `trainingLevel` и может сразу перейти к составлению программы.
4. Система предлагает тренировочный план на основе уровня, цели и истории.
5. Пользователь может:
   - отредактировать программу
   - заменить упражнение
   - удалить упражнение
   - добавить упражнение
6. Тренировки можно планировать в календаре.
7. В день тренировки пользователь запускает активную сессию, проходит упражнения и фиксирует рабочие веса.
8. После завершения тренировки данные уходят в историю и влияют на адаптацию программы.

### Основные возможности

- регистрация и авторизация
- тест на уровень подготовки
- оценка уровня через отдельный backend-сервис
- генерация персонального тренировочного плана
- псевдо-ML адаптация упражнений и объёма
- календарь с запланированными, выполненными, пропущенными и отменёнными тренировками
- активная тренировка с таймером, подходами, отдыхом и весами
- статистика по выполнению плана, нагрузке, прогрессу и адаптации
- библиотека упражнений
- PWA-режим с установкой на устройство

## Архитектура

### Frontend

Стек:

- React 19
- React Router
- Vite 8
- Tailwind CSS 4

Ключевые блоки:

- маршруты приложения: [frontend/src/App.jsx](./frontend/src/App.jsx)
- роуты: [frontend/src/constants/routes.js](./frontend/src/constants/routes.js)
- генерация тренировочного плана на frontend: [frontend/src/shared/trainingPlanBuilder.js](./frontend/src/shared/trainingPlanBuilder.js)
- runtime активной тренировки: [frontend/src/shared/activeWorkout.js](./frontend/src/shared/activeWorkout.js)
- статистика: [frontend/src/shared/workoutStats.js](./frontend/src/shared/workoutStats.js)

### Backend

Стек:

- Node.js
- Express 5
- MySQL2
- JSON fallback для локальной разработки и аварийного режима

Ключевые блоки:

- точка входа API: [backend/app.js](./backend/app.js)
- подключение MySQL: [backend/db/mysqlPool.js](./backend/db/mysqlPool.js)
- схема базы: [backend/sql/schema.sql](./backend/sql/schema.sql)
- генерация умного плана: [backend/services/smartTrainingPlan.js](./backend/services/smartTrainingPlan.js)
- подбор упражнений: [backend/services/workoutGenerator.js](./backend/services/workoutGenerator.js)
- адаптация объёма: [backend/services/adaptiveVolume.js](./backend/services/adaptiveVolume.js)
- история адаптаций плана: [backend/services/trainingPlanAdaptationHistory.js](./backend/services/trainingPlanAdaptationHistory.js)
- оценка уровня подготовки: [backend/services/trainingLevelEvaluator.js](./backend/services/trainingLevelEvaluator.js)

## Структура проекта

```text
WORKOUTSHEDULE/
├─ backend/
│  ├─ app.js
│  ├─ index.js
│  ├─ db/
│  ├─ data/
│  ├─ modules/
│  ├─ repositories/
│  ├─ services/
│  ├─ shared/
│  └─ sql/
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ hooks/
│  │  ├─ pages/
│  │  ├─ services/
│  │  ├─ shared/
│  │  └─ utils/
│  └─ vite.config.js
└─ README.md
```

## Основные сущности

### Пользователь

В модели пользователя уже используются:

- `login`
- `name`
- `password`
- `email`
- `profilePhoto`
- `trainingLevel`
- `lastTestScore`
- `trainingPlan`
- `trainingPlanAdaptationHistory`
- `scheduledWorkouts`
- `workoutHistory`

### Тренировочный план

План хранит:

- частоту тренировок
- фокус
- список тренировочных дней
- список упражнений по дням
- рекомендованные подходы
- диапазоны повторений
- время отдыха
- причины адаптации объёма

### История тренировок

В истории уже сохраняются:

- статус тренировки
- дата и время
- фактическая длительность
- плановая длительность
- количество выполненных упражнений
- количество выполненных подходов
- веса по подходам
- калории
- вес тела

## API

### Общие endpoints

- `GET /api/health`
- `GET /api/exercises`

### Авторизация и профиль

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users/:id`
- `PATCH /api/users/:id/profile`

### Тест и уровень подготовки

- `PATCH /api/users/:id/training-result`
- `POST /api/users/:id/evaluate-training-level`

### Тренировочный план

- `PUT /api/users/:id/training-plan`
- `POST /api/workouts/smart`
- `POST /api/workouts/smart-plan`

### Календарь и тренировки

- `POST /api/users/:id/scheduled-workouts`
- `DELETE /api/users/:id/scheduled-workouts/:scheduledWorkoutId`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/skip`
- `POST /api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete`

### Статистика

- `GET /api/users/:id/stats`

## PWA

Frontend уже подготовлен как Progressive Web App.

Что есть:

- `manifest.webmanifest`
- service worker
- offline page
- install prompt

Файлы:

- [frontend/public/manifest.webmanifest](./frontend/public/manifest.webmanifest)
- [frontend/public/sw.js](./frontend/public/sw.js)
- [frontend/src/utils/registerServiceWorker.js](./frontend/src/utils/registerServiceWorker.js)
- [frontend/src/hooks/useInstallPrompt.js](./frontend/src/hooks/useInstallPrompt.js)

## Локальный запуск

### Требования

- Node.js 20+
- npm 10+
- MySQL 8+ или MariaDB

### 1. Backend

Перейти в папку:

```bash
cd backend
```

Установить зависимости:

```bash
npm install
```

Создать `.env` на основе примера:

```bash
cp .env.example .env
```

Пример переменных:

```env
API_PORT=3001
SERVER_DB_PROVIDER=auto
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=workoutshedule
```

Запуск в dev-режиме:

```bash
npm run dev
```

Запуск в production:

```bash
npm start
```

### 2. Frontend

Перейти в папку:

```bash
cd frontend
```

Установить зависимости:

```bash
npm install
```

Запуск в dev-режиме:

```bash
npm run dev
```

Сборка production:

```bash
npm run build
```

Preview сборки:

```bash
npm run preview
```

## Как работает база данных

Backend поддерживает два режима хранения:

- `mysql`
- `json`

Значение задаётся переменной:

```env
SERVER_DB_PROVIDER=auto
```

В режиме `auto` backend пытается подключиться к MySQL. Если база недоступна, он использует JSON fallback.

Это удобно:

- для локальной разработки
- для отладки
- как временный резервный режим

## Адаптация плана под пользователя

Сейчас в проекте уже есть rule-based псевдо-ML слой.

Он учитывает:

- уровень подготовки пользователя
- цель тренировки
- число тренировок в неделю
- историю завершённых тренировок
- рабочие веса
- признаки прогресса и плато
- ручные правки пользователя

Что уже адаптируется:

- состав упражнений
- объём внутри упражнения
- рекомендуемые подходы
- диапазоны повторений
- время отдыха

Причины адаптации уже выводятся в UI:

- прогресс
- плато
- ручная корректировка
- базовый объём

## Статистика

Экран статистики уже показывает:

- выполнение плана
- completed / partial / skipped / canceled
- нагрузку по неделям
- прогресс по весам
- историю адаптаций плана
- топ упражнений по весам
- последние тренировки
- диапазоны `7 дней / 30 дней / все время`

## Библиотека упражнений

На текущем этапе библиотека реализована как сплошной список карточек:

- название
- зона
- сложность
- тип
- инвентарь
- раскрытие с деталями

Следующие логичные шаги для библиотеки:

- поиск
- фильтры
- группировка по мышцам
- видео / техника выполнения

## Production deployment на Ubuntu

Рекомендуемый порядок:

### 1. Обновить код на сервере

```bash
git pull
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run build
```

Если `backend` раздаёт собранный frontend, убедись, что `frontend/dist` существует на сервере.

### 4. PM2 пример

```bash
cd backend
pm2 start index.js --name workoutshedule-api
pm2 save
```

## Известные замечания

На Windows локальная production-сборка frontend может падать из-за бинарника `@tailwindcss/oxide` и `spawn EPERM`.

Это не относится к логике приложения. Если такое происходит:

- собирай frontend на Ubuntu/Linux
- или собирай прямо на сервере

## Roadmap

Ближайшие улучшения, под которые проект уже подготовлен:

- фильтры и поиск в библиотеке упражнений
- архив старых тренировочных планов
- более глубокая статистика по упражнениям
- реальная ML / ranking-модель вместо rule-based слоя
- улучшенный прод-деплой и процесс обновления

## Статус проекта

Проект находится в активной разработке, но уже включает полноценный пользовательский цикл:

- регистрация
- тест
- план
- календарь
- активная тренировка
- история
- статистика
- библиотека

Если использовать его как основу для следующего этапа, то логичнее всего дальше усиливать:

- backend сервисы адаптации
- статистику
- библиотеку упражнений
- production deployment flow
