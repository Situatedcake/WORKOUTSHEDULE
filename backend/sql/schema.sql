CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  login VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(150) NULL,
  profile_photo LONGTEXT NULL,
  training_level VARCHAR(100) NOT NULL DEFAULT 'Не определен',
  last_test_score INT NULL,
  training_plan_json LONGTEXT NULL,
  training_plan_adaptation_history_json LONGTEXT NULL,
  scheduled_workouts_json LONGTEXT NULL,
  workout_history_json LONGTEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
