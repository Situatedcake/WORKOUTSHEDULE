Database layer

Current state:
- The frontend talks only to `userRepository.js`.
- The active provider is `api`.
- The API is served by `server/index.js`.
- Data is stored in MySQL through `mysql2`.

Frontend flow:
- `apiUserStorage.js` calls `/api/auth/login`
- `apiUserStorage.js` calls `/api/auth/register`
- `apiUserStorage.js` calls `/api/users/:id`
- `apiUserStorage.js` calls `/api/users/:id/training-result`

Backend flow:
- `server/index.js` starts the Express API
- `server/db/mysqlPool.js` creates the database and table if needed
- `server/repositories/mysqlUserRepository.js` contains MySQL queries

To run:
1. Copy `.env.example` to `.env`
2. Fill in your MySQL credentials
3. Run `npm run dev`

Note:
- Passwords are still stored as plain text for now.
- The next backend step should be password hashing with `bcrypt`.
