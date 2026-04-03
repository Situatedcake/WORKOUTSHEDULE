# Backend Data

Редактируемые исходные данные проекта теперь лежат здесь, внутри `backend/data`.

Основные файлы:
- `trainingPlanCatalog.js` — библиотека шаблонов тренировок и blueprint-структуры для smart-plan/ML.
- `exerciseCatalog.js` — каталог упражнений.
- `questions.js` — вопросы теста.

Как это работает:
- frontend больше не импортирует эти данные напрямую;
- backend читает их локально и отдаёт только нужные части через API;
- в production сами source data-файлы не попадают в клиентский bundle.

Какие endpoints используют эти данные:
- `GET /api/testing/questions`
- `GET /api/training/config`
- `POST /api/workouts/basic-plan`
- `POST /api/workouts/smart-plan`

Рекомендации:
- новые планы удобнее добавлять по образцу из `trainingPlanCatalog.js`;
- не меняй имена экспортов без обновления backend-импортов;
- если нужен mock/dev-слой, он должен брать данные отсюда, а не из frontend.
