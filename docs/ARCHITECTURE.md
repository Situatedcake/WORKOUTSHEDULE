# Architecture

## 1. Overview

Проект состоит из двух основных частей:

- `frontend` (React + Vite): UI, роутинг, состояние пользователя, тренировки, статистика.
- `backend` (Node.js + Express): API, генерация плана, адаптация, геймификация, хранение данных.

## 2. Storage Strategy

Backend поддерживает 3 режима провайдера хранения:

- `mysql` — основной режим.
- `json` — fallback.
- `auto` — пытается MySQL, при ошибке переключается на JSON.

Ключевая переменная окружения: `SERVER_DB_PROVIDER`.

## 3. Main User Flow

1. Регистрация/логин (`/api/auth/register`, `/api/auth/login`).
2. Прохождение теста уровня (tasting).
3. Оценка уровня и построение плана.
4. Планирование тренировок в календаре.
5. Активная тренировка с фиксацией подходов/весов.
6. Завершение тренировки и запись в историю.
7. Обновление статистики, адаптации, геймификации.

## 4. Adaptation Loop

После завершения тренировок backend:

- сохраняет историю сессии (`workoutHistory`);
- сохраняет ML-feedback события (`trainingMlFeedbackHistory`);
- пересчитывает признаки (`trainingFeatureBuilder`);
- использует признаки в генераторе плана (`smartTrainingPlan`, `workoutGenerator`);
- обновляет план с причинами адаптации.

## 5. Key Backend Layers

- `repositories/` — работа с БД (MySQL/JSON).
- `services/` — бизнес-логика (статистика, адаптация, геймификация).
- `shared/` — общие утилиты плана/календаря/тренировки.
- `features/tasting/` — изолированная логика теста.
- `data/` — каталоги упражнений, планов, достижений.

## 6. Key Frontend Layers

- `pages/` — маршруты и экраны.
- `components/` — переиспользуемые UI-блоки.
- `contexts/` — Auth/Theme.
- `services/database/` — API и fallback storage.
- `shared/` — общие вычисления статистики/плана/расписания.
- `utils/` — session utilities, service worker registration и т.п.
