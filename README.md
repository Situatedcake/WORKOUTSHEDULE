# WORKOUTSHEDULE

WorkoutSchedule — это приложение для планирования тренировок с фронтендом на React/Vite и бэкендом на Express/MySQL.

Пользователь проходит фитнес-тест, получает уровень подготовки, создает персональный план, планирует тренировки в календаре, выполняет их и отслеживает прогресс.

Текущая версия проекта: `1.0.5`

---

## Обзор

Проект разделен на две части:

- `frontend/` — React, Vite, Tailwind CSS, PWA
- `backend/` — Express, MySQL, JSON fallback

Основной пользовательский сценарий:

1. Регистрация и вход по `логину + паролю`
2. Прохождение фитнес-теста
3. Получение `score` и `trainingLevel`
4. Создание или редактирование персонального плана тренировок
5. Планирование тренировок в календаре
6. Запуск тренировки в назначенный день
7. Сохранение результатов: веса, выполнение и т.д.
8. Адаптация будущих тренировок на основе прогресса и истории

---

## Функциональность

- Регистрация и авторизация
- Редактирование профиля: имя, email, пароль, фото, пол
- Фитнес-тест и определение уровня подготовки
- Генерация персонального плана тренировок
- Псевдо-ML адаптация упражнений и нагрузки
- Календарь тренировок: планирование, выполнение, отмена, перенос
- Активная тренировка: подходы, таймер отдыха, учет веса
- История тренировок и статистика
- Библиотека упражнений
- PWA: установка и базовая оффлайн-работа

---

## Технологический стек

### Фронтенд

- React 19
- React Router
- Vite 8
- Tailwind CSS 4
- PWA (manifest + service worker)

### Бэкенд

- Node.js
- Express 5
- MySQL2
- JSON fallback

---

## Структура проекта

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

---

## Ключевые файлы

### Фронтенд

- Маршруты: `frontend/src/App.jsx`
- Константы маршрутов: `frontend/src/constants/routes.js`
- Конструктор тренировок: `StartTraningPage.jsx`
- Экран плана тренировок: `WorkoutPlanPage.jsx`
- Экран активной тренировки: `TraningPage.jsx`
- Календарь: `Calendare.jsx`
- Статистика: `StatisticPage.jsx`
- Библиотека упражнений: `LibraryPage.jsx`
- Помощники планов: `trainingPlanBuilder.js`
- Логика активной тренировки: `activeWorkout.js`
- Статистика: `workoutStats.js`

### Бэкенд

- Точка входа API: `backend/app.js`
- Подключение к MySQL: `mysqlPool.js`
- SQL схема: `schema.sql`
- Генерация плана: `smartTrainingPlan.js`
- Ранжирование упражнений: `workoutGenerator.js`
- Адаптация нагрузки: `adaptiveVolume.js`
- Оценка уровня: `trainingLevelEvaluator.js`
- Формирование фичей (для ML): `trainingFeatureBuilder.js`
- ML-фидбек: `trainingMlFeedback.js`
- История адаптаций: `trainingPlanAdaptationHistory.js`
- Каталог планов: `trainingPlanCatalog.js`
- Каталог упражнений: `exerciseCatalog.js`

---

## Модель данных

### Пользователь

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

---

### План тренировок

- `focusKey`
- `focusLabel`
- `workoutsPerWeek`
- `sessions`
- упражнения
- подходы, повторения, отдых
- подсказки адаптации
- версия

---

### История тренировок

- статус
- дата и время
- фактическая длительность
- плановая длительность
- выполненные упражнения
- подходы
- веса
- калории
- вес тела
- субъективные показатели (энергия, усилие)

---

## Псевдо-ML адаптация

Проект пока не использует обученную нейросеть. Вместо этого применяется rule-based система рекомендаций.

Возможности:

- оценка уровня подготовки
- преобразование профиля и истории в фичи
- ранжирование упражнений по:
  - уровню
  - цели
  - оборудованию
  - группе мышц
  - истории

- адаптация подходов, отдыха и повторений
- сохранение фидбека для будущего ML

Типы фидбека:

- `exercise_removed`
- `exercise_replaced`
- `sets_decreased`
- `workout_skipped`
- `workout_partial`

---

## API

### Общее

- `GET /api/health`
- `GET /api/exercises`

### Авторизация

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users/:id`
- `PATCH /api/users/:id/profile`

### Тест

- `PATCH /api/users/:id/training-result`
- `POST /api/users/:id/evaluate-training-level`

### Планы

- `PUT /api/users/:id/training-plan`
- `POST /api/workouts/smart`
- `POST /api/workouts/smart-plan`
- `POST /api/users/:id/training-feedback`

### Календарь

- `POST /api/users/:id/scheduled-workouts`
- `PATCH /api/users/:id/scheduled-workouts/:id`
- `DELETE /api/users/:id/scheduled-workouts/:id`
- `POST /skip`
- `POST /complete`

### Статистика

- `GET /api/users/:id/stats`

---

## Локальная разработка

### Требования

- Node.js 20+
- npm 10+
- MySQL 8+ или MariaDB

---

### Бэкенд

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

---

## MySQL и JSON fallback

- MySQL — основное хранилище
- JSON — резерв (для разработки и восстановления)

---

## PWA

Включает:

- manifest
- service worker
- offline страницу
- установку приложения

---

## Деплой на Ubuntu

```bash
git pull
cd backend && npm ci
cd ../frontend && npm ci && npm run build
cd ../backend && npm start
```

PM2:

```bash
pm2 start index.js --name workoutshedule-api
pm2 save
```

---

## Текущие направления

- авторизация и профиль
- тест и уровень
- генерация планов
- активные тренировки
- календарь
- статистика
- библиотека упражнений
- адаптивные системы

---

## Примечания

- Используется псевдо-ML, не полноценная модель
- Были фиксы для Windows (Vite/Tailwind)
- Лицензия пока не добавлена

---

## Roadmap

- переработка статистики
- улучшение поиска упражнений
- более глубокая адаптация
- сравнение планов
- внедрение настоящего ML
