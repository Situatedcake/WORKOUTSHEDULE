CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(150) NULL,
  profile_photo LONGTEXT NULL,
  training_level VARCHAR(100) NOT NULL DEFAULT 'Не определен',
  last_test_score INT NULL,
  training_plan_json LONGTEXT NULL,
  scheduled_workouts_json LONGTEXT NULL,
  workout_history_json LONGTEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(150) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_photo LONGTEXT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS training_plan_json LONGTEXT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS scheduled_workouts_json LONGTEXT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS workout_history_json LONGTEXT NULL;
