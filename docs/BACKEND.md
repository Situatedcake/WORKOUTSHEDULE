# Backend Guide

## Tech

- Node.js (ESM)
- Express 5
- mysql2
- dotenv

## Entry Points

- `backend/index.js` — запуск сервера.
- `backend/app.js` — инициализация express app и роутов.
- `backend/config.js` — конфиг окружения.

## Main Directories

- `backend/repositories/` — MySQL/JSON implementations.
- `backend/services/` — бизнес логика.
- `backend/shared/` — shared domain helpers.
- `backend/features/tasting/` — тест уровня подготовки.
- `backend/data/` — каталоги и статические данные.
- `backend/sql/` — schema.

## Security Note

Пароли хешируются через `bcryptjs`:

- `backend/services/passwordHash.js`
- при логине legacy plain password автоматически мигрируется в hash.

## Where to Extend

- Добавить новый endpoint: `backend/app.js`
- Добавить доменную логику: `backend/services/*`
- Добавить хранение: `backend/repositories/*`
- Добавить новую таблицу/поле: `backend/sql/schema.sql` + runtime migration (`db/mysqlPool.js`)
