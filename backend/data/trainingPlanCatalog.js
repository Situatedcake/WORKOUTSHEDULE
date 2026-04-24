export const TRAINING_PLAN_LIBRARY = [
  {
    key: "full-body-unified",
    label: "Фулл Бади",
    description:
      "Универсальный full-body план с одинаковой недельной нагрузкой и разным распределением по дням.",
    mlProfile: {
      objective: "balanced_strength_mass",
      recommendedTrainingLevels: ["Начинающий", "Средний", "Продвинутый"],
      recommendedWorkoutsPerWeek: [2, 3, 4, 5],
      focusTags: ["full-body", "strength", "mass"],
      adaptationPriority: "volume_distribution",
    },
    versions: {
      "5_days": {
        duration: 60,
        sessions: [
          {
            key: "push",
            title: "День Груди и Трицепса",
            emphasis: "Грудь, плечи, трицепс",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Жим гантелей на наклонной скамье",
                bodyPart: "upper_chest",
                movementPattern: "incline_push",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Жим гантелей сидя",
                bodyPart: "shoulders",
                movementPattern: "vertical_push",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Махи гантелями в стороны",
                bodyPart: "shoulders",
                movementPattern: "shoulder_abduction",
                equipment: ["dumbbell"],
                priority: 4,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 5,
              },
            ],
          },
          {
            key: "pull",
            title: "День Спины и Бицепса",
            emphasis: "Спина и бицепс",
            exercisePool: [
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 1,
              },
              {
                name: "Тяга штанги в наклоне",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Тяга гантели одной рукой",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 4,
              },
              {
                name: "Тяга каната к лицу",
                bodyPart: "shoulders",
                movementPattern: "face_pull",
                equipment: ["rope"],
                priority: 5,
              },
            ],
          },
          {
            key: "legs",
            title: "День Ног",
            emphasis: "Ноги",
            exercisePool: [
              {
                name: "Приседания со штангой",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Румынская тяга",
                bodyPart: "legs",
                movementPattern: "hip_hinge",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Выпады в ходьбе",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Подъемы на носки стоя",
                bodyPart: "legs",
                movementPattern: "ankle_plantarflexion",
                equipment: ["machine"],
                priority: 4,
              },
            ],
          },
          {
            key: "shoulders",
            title: "День Плечей",
            emphasis: "Плечи и стабилизация",
            exercisePool: [
              {
                name: "Жим гантелей сидя",
                bodyPart: "shoulders",
                movementPattern: "vertical_push",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Разведение гантелей в наклоне на заднюю дельту",
                bodyPart: "shoulders",
                movementPattern: "horizontal_abduction",
                equipment: ["dumbbell"],
                priority: 2,
              },
            ],
          },
          {
            key: "core",
            title: "Кор и заминка",
            emphasis: "Кор",
            exercisePool: [
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 2,
              },
            ],
          },
        ],
      },
      "4_days": {
        duration: 75,
        sessions: [
          {
            key: "upper_a",
            title: "День Груди и Трицепса",
            emphasis: "Грудь, спина, плечи, бицепс",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Жим гантелей сидя",
                bodyPart: "shoulders",
                movementPattern: "vertical_push",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 4,
              },
            ],
          },
          {
            key: "lower",
            title: "Lower",
            emphasis: "Ноги",
            exercisePool: [
              {
                name: "Приседания со штангой",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Румынская тяга",
                bodyPart: "legs",
                movementPattern: "hip_hinge",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Выпады в ходьбе",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Подъемы на носки стоя",
                bodyPart: "legs",
                movementPattern: "ankle_plantarflexion",
                equipment: ["machine"],
                priority: 4,
              },
            ],
          },
          {
            key: "upper_b",
            title: "День Груди и Трицепса",
            emphasis: "Грудь, спина, плечи, трицепс",
            exercisePool: [
              {
                name: "Жим гантелей лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Тяга штанги в наклоне",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Махи гантелями в стороны",
                bodyPart: "shoulders",
                movementPattern: "shoulder_abduction",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 4,
              },
            ],
          },
          {
            key: "core_finish",
            title: "Кор и здоровье плеч",
            emphasis: "Кор и здоровье плеч",
            exercisePool: [
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Тяга каната к лицу",
                bodyPart: "shoulders",
                movementPattern: "face_pull",
                equipment: ["rope"],
                priority: 3,
              },
            ],
          },
        ],
      },
      "3_days": {
        duration: 100,
        sessions: [
          {
            key: "full_a",
            title: "День 1",
            emphasis: "База",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Тяга штанги в наклоне",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Приседания со штангой",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 4,
              },
            ],
          },
          {
            key: "full_b",
            title: "День 2",
            emphasis: "Баланс",
            exercisePool: [
              {
                name: "Жим гантелей лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Румынская тяга",
                bodyPart: "legs",
                movementPattern: "hip_hinge",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 4,
              },
            ],
          },
          {
            key: "full_c",
            title: "Full Body C",
            emphasis: "Добивка",
            exercisePool: [
              {
                name: "Выпады в ходьбе",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Махи гантелями в стороны",
                bodyPart: "shoulders",
                movementPattern: "shoulder_abduction",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
        ],
      },
      "2_days": {
        duration: 150,
        sessions: [
          {
            key: "full_a",
            title: "День 1",
            emphasis: "Верх + база",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Тяга штанги в наклоне",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Приседания со штангой",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 4,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 5,
              },
            ],
          },
          {
            key: "full_b",
            title: "День 2",
            emphasis: "Низ + баланс",
            exercisePool: [
              {
                name: "Жим гантелей лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Румынская тяга",
                bodyPart: "legs",
                movementPattern: "hip_hinge",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Выпады в ходьбе",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 4,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 5,
              },
            ],
          },
        ],
      },
    },
  },

  {
    key: "arms-unified",
    label: "Упор на руки",
    description:
      "Универсальный план с приоритетом на бицепс и трицепс, где недельная нагрузка сохраняется при разном количестве тренировочных дней.",
    mlProfile: {
      objective: "arms_specialization_balance",
      recommendedTrainingLevels: ["Начинающий", "Средний", "Продвинутый"],
      recommendedWorkoutsPerWeek: [2, 3, 4, 5],
      focusTags: ["arms", "biceps", "triceps", "mass", "balance"],
      adaptationPriority: "arms_growth",
    },
    versions: {
      "5_days": {
        duration: 60,
        sessions: [
          {
            key: "biceps",
            title: "Бицепс",
            emphasis: "Бицепс и предплечья",
            exercisePool: [
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Подъем гантелей на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Молотковые сгибания",
                bodyPart: "arms",
                movementPattern: "neutral_grip_curl",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Сгибания на бицепс с канатом нейтральным хватом",
                bodyPart: "arms",
                movementPattern: "neutral_grip_curl",
                equipment: ["rope"],
                priority: 4,
              },
            ],
          },
          {
            key: "triceps",
            title: "Трицепс",
            emphasis: "Трицепс",
            exercisePool: [
              {
                name: "Жим лежа узким хватом",
                bodyPart: "arms",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 2,
              },
              {
                name: "Разгибание гантели из-за головы",
                bodyPart: "arms",
                movementPattern: "overhead_elbow_extension",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Обратные отжимания от скамьи",
                bodyPart: "arms",
                movementPattern: "dip",
                equipment: ["bench"],
                priority: 4,
              },
            ],
          },
          {
            key: "upper_support",
            title: "Спина и Плечи,",
            emphasis: "Спина и плечи для баланса",
            exercisePool: [
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 1,
              },
              {
                name: "Тяга гантели одной рукой",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Тяга каната к лицу",
                bodyPart: "shoulders",
                movementPattern: "face_pull",
                equipment: ["rope"],
                priority: 3,
              },
            ],
          },
          {
            key: "chest_support",
            title: "Поддержка жимовых движений",
            emphasis: "Поддержка жимовых движений",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Жим гантелей лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Жим гантелей на наклонной скамье",
                bodyPart: "upper_chest",
                movementPattern: "incline_push",
                equipment: ["dumbbell"],
                priority: 3,
              },
            ],
          },
          {
            key: "arms_pump_core",
            title: "Корпус и добивка рук",
            emphasis: "Добивка рук и корпус",
            exercisePool: [
              {
                name: "Попеременный подъем гантелей на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Сгибание рук в тренажере на скамье Скотта",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
        ],
      },
      "4_days": {
        duration: 75,
        sessions: [
          {
            key: "arms_strength",
            title: "День Силы Рук",
            emphasis: "Силовой акцент на руки",
            exercisePool: [
              {
                name: "Жим лежа узким хватом",
                bodyPart: "arms",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 2,
              },
              {
                name: "Молотковые сгибания",
                bodyPart: "arms",
                movementPattern: "neutral_grip_curl",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 4,
              },
            ],
          },
          {
            key: "upper_balance",
            title: "День Спины и Плечей",
            emphasis: "Спина, грудь, плечи",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Тяга штанги в наклоне",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Жим гантелей сидя",
                bodyPart: "shoulders",
                movementPattern: "vertical_push",
                equipment: ["dumbbell"],
                priority: 4,
              },
              {
                name: "Тяга каната к лицу",
                bodyPart: "shoulders",
                movementPattern: "face_pull",
                equipment: ["rope"],
                priority: 5,
              },
            ],
          },
          {
            key: "lower_support",
            title: "День Ног и Стабилизации",
            emphasis: "Ноги и стабилизация",
            exercisePool: [
              {
                name: "Жим ногами",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["machine"],
                priority: 1,
              },
              {
                name: "Румынская тяга с гантелями",
                bodyPart: "legs",
                movementPattern: "hip_hinge",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Обратные выпады",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 4,
              },
            ],
          },
          {
            key: "arms_volume",
            title: "День Объема Рук",
            emphasis: "Объемная добивка рук",
            exercisePool: [
              {
                name: "Попеременный подъем гантелей на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Сгибания на бицепс с канатом нейтральным хватом",
                bodyPart: "arms",
                movementPattern: "neutral_grip_curl",
                equipment: ["rope"],
                priority: 2,
              },
              {
                name: "Разгибание гантели из-за головы",
                bodyPart: "arms",
                movementPattern: "overhead_elbow_extension",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Обратные отжимания от скамьи",
                bodyPart: "arms",
                movementPattern: "dip",
                equipment: ["bench"],
                priority: 4,
              },
            ],
          },
        ],
      },
      "3_days": {
        duration: 100,
        sessions: [
          {
            key: "arms_main",
            title: "День Силы Рук",
            emphasis: "Основной день рук",
            exercisePool: [
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Молотковые сгибания",
                bodyPart: "arms",
                movementPattern: "neutral_grip_curl",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Жим лежа узким хватом",
                bodyPart: "arms",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 4,
              },
              {
                name: "Разгибание гантели из-за головы",
                bodyPart: "arms",
                movementPattern: "overhead_elbow_extension",
                equipment: ["dumbbell"],
                priority: 5,
              },
            ],
          },
          {
            key: "upper_support",
            title: "День Спины и Плечей",
            emphasis: "Поддержка верха тела",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Тяга гантели одной рукой",
                bodyPart: "back",
                movementPattern: "horizontal_pull",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Тяга каната к лицу",
                bodyPart: "shoulders",
                movementPattern: "face_pull",
                equipment: ["rope"],
                priority: 4,
              },
            ],
          },
          {
            key: "lower_support",
            title: "День Ног и Стабилизации",
            emphasis: "Низ тела и кор",
            exercisePool: [
              {
                name: "Гоблет-присед",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["dumbbell"],
                priority: 1,
              },
              {
                name: "Румынская тяга с гантелями",
                bodyPart: "legs",
                movementPattern: "hip_hinge",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Подъемы на носки сидя",
                bodyPart: "legs",
                movementPattern: "ankle_plantarflexion",
                equipment: ["machine"],
                priority: 3,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 4,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 5,
              },
            ],
          },
        ],
      },
      "2_days": {
        duration: 150,
        sessions: [
          {
            key: "arms_a",
            title: "День 1",
            emphasis: "Бицепс и трицепс — силовой акцент",
            exercisePool: [
              {
                name: "Подъем штанги на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Молотковые сгибания",
                bodyPart: "arms",
                movementPattern: "neutral_grip_curl",
                equipment: ["dumbbell"],
                priority: 2,
              },
              {
                name: "Жим лежа узким хватом",
                bodyPart: "arms",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 3,
              },
              {
                name: "Разгибание рук на блоке с канатом",
                bodyPart: "arms",
                movementPattern: "elbow_extension",
                equipment: ["rope"],
                priority: 4,
              },
              {
                name: "Разгибание гантели из-за головы",
                bodyPart: "arms",
                movementPattern: "overhead_elbow_extension",
                equipment: ["dumbbell"],
                priority: 5,
              },
            ],
          },
          {
            key: "arms_b",
            title: "День 2",
            emphasis: "Баланс тела и объем рук",
            exercisePool: [
              {
                name: "Жим лежа",
                bodyPart: "chest",
                movementPattern: "horizontal_push",
                equipment: ["barbell"],
                priority: 1,
              },
              {
                name: "Тяга верхнего блока к груди",
                bodyPart: "back",
                movementPattern: "vertical_pull",
                equipment: ["machine"],
                priority: 2,
              },
              {
                name: "Попеременный подъем гантелей на бицепс",
                bodyPart: "arms",
                movementPattern: "elbow_flexion",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Обратные отжимания от скамьи",
                bodyPart: "arms",
                movementPattern: "dip",
                equipment: ["bench"],
                priority: 4,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 5,
              },
            ],
          },
        ],
      },
    },
  },

  {
    key: "cardio-unified",
    label: "Кардио программа",
    description:
      "Универсальный кондиционный план с одинаковой недельной нагрузкой, собранный из кардио- и функциональных упражнений каталога.",
    mlProfile: {
      objective: "conditioning_weight_loss",
      recommendedTrainingLevels: ["Начинающий", "Средний", "Продвинутый"],
      recommendedWorkoutsPerWeek: [2, 3, 4, 5],
      focusTags: ["cardio", "conditioning", "weight-loss", "endurance"],
      adaptationPriority: "energy_expenditure",
    },
    versions: {
      "5_days": {
        duration: 60,
        sessions: [
          {
            key: "jumping_day",
            title: "Прыжковая нагрузка",
            emphasis: "Прыжковая кардио-нагрузка",
            exercisePool: [
              {
                name: "Прыжки на скакалке",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["rope"],
                priority: 1,
              },
              {
                name: "Прыжки ноги-врозь руки-вверх",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
          {
            key: "conditioning_day",
            title: "Общая выносливость",
            emphasis: "Общая выносливость",
            exercisePool: [
              {
                name: "Бёрпи",
                bodyPart: "full_body",
                movementPattern: "full_body_conditioning",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Альпинист",
                bodyPart: "cardio",
                movementPattern: "dynamic_plank",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Дэд баг",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
          {
            key: "running_pattern_day",
            title: "Беговой паттерн",
            emphasis: "Беговой паттерн и кор",
            exercisePool: [
              {
                name: "Бег с высоким подниманием колен",
                bodyPart: "cardio",
                movementPattern: "running_pattern",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Боковая планка",
                bodyPart: "core",
                movementPattern: "anti_lateral_flexion",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
          {
            key: "lower_body_cardio",
            title: "Ноги и пульсовая работа",
            emphasis: "Ноги и пульсовая работа",
            exercisePool: [
              {
                name: "Приседания с собственным весом",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Зашагивания на скамью",
                bodyPart: "legs",
                movementPattern: "step_up",
                equipment: ["bench"],
                priority: 2,
              },
              {
                name: "Обратные выпады",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
            ],
          },
          {
            key: "mixed_circuit",
            title: "Смешанный день",
            emphasis: "Смешанный круг",
            exercisePool: [
              {
                name: "Альпинист",
                bodyPart: "cardio",
                movementPattern: "dynamic_plank",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Прыжки ноги-врозь руки-вверх",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Берд дог",
                bodyPart: "core",
                movementPattern: "anti_rotation",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
        ],
      },
      "4_days": {
        duration: 75,
        sessions: [
          {
            key: "cardio_a",
            title: "Прыжки и интенсивность",
            emphasis: "Прыжки и интенсивность",
            exercisePool: [
              {
                name: "Прыжки на скакалке",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["rope"],
                priority: 1,
              },
              {
                name: "Бёрпи",
                bodyPart: "full_body",
                movementPattern: "full_body_conditioning",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
          {
            key: "cardio_b",
            title: "Динамический кор и выносливость",
            emphasis: "Динамический кор и выносливость",
            exercisePool: [
              {
                name: "Альпинист",
                bodyPart: "cardio",
                movementPattern: "dynamic_plank",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Бег с высоким подниманием колен",
                bodyPart: "cardio",
                movementPattern: "running_pattern",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Дэд баг",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
          {
            key: "cardio_c",
            title: "Ноги и кондиция",
            emphasis: "Ноги и кондиция",
            exercisePool: [
              {
                name: "Приседания с собственным весом",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Зашагивания на скамью",
                bodyPart: "legs",
                movementPattern: "step_up",
                equipment: ["bench"],
                priority: 2,
              },
              {
                name: "Обратные выпады",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Подъемы на носки на одной ноге",
                bodyPart: "legs",
                movementPattern: "ankle_plantarflexion",
                equipment: ["bodyweight"],
                priority: 4,
              },
            ],
          },
          {
            key: "cardio_d",
            title: "Смешанный круг и стабилизация",
            emphasis: "Смешанный круг и стабилизация",
            exercisePool: [
              {
                name: "Прыжки ноги-врозь руки-вверх",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Боковая планка",
                bodyPart: "core",
                movementPattern: "anti_lateral_flexion",
                equipment: ["bodyweight"],
                priority: 3,
              },
            ],
          },
        ],
      },
      "3_days": {
        duration: 100,
        sessions: [
          {
            key: "conditioning_a",
            title: "День 1",
            emphasis: "Интенсивный круг",
            exercisePool: [
              {
                name: "Бёрпи",
                bodyPart: "full_body",
                movementPattern: "full_body_conditioning",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Прыжки на скакалке",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["rope"],
                priority: 2,
              },
              {
                name: "Альпинист",
                bodyPart: "cardio",
                movementPattern: "dynamic_plank",
                equipment: ["bodyweight"],
                priority: 3,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 4,
              },
            ],
          },
          {
            key: "conditioning_b",
            title: "День 2",
            emphasis: "Ноги и кардио",
            exercisePool: [
              {
                name: "Приседания с собственным весом",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Зашагивания на скамью",
                bodyPart: "legs",
                movementPattern: "step_up",
                equipment: ["bench"],
                priority: 2,
              },
              {
                name: "Обратные выпады",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Бег с высоким подниманием колен",
                bodyPart: "cardio",
                movementPattern: "running_pattern",
                equipment: ["bodyweight"],
                priority: 4,
              },
            ],
          },
          {
            key: "conditioning_c",
            title: "День 3",
            emphasis: "Кор и выносливость",
            exercisePool: [
              {
                name: "Прыжки ноги-врозь руки-вверх",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 2,
              },
              {
                name: "Боковая планка",
                bodyPart: "core",
                movementPattern: "anti_lateral_flexion",
                equipment: ["bodyweight"],
                priority: 3,
              },
              {
                name: "Берд дог",
                bodyPart: "core",
                movementPattern: "anti_rotation",
                equipment: ["bodyweight"],
                priority: 4,
              },
            ],
          },
        ],
      },
      "2_days": {
        duration: 150,
        sessions: [
          {
            key: "conditioning_a",
            title: "День 1",
            emphasis: "Интенсивный кардио-круг",
            exercisePool: [
              {
                name: "Бёрпи",
                bodyPart: "full_body",
                movementPattern: "full_body_conditioning",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Прыжки на скакалке",
                bodyPart: "cardio",
                movementPattern: "jumping_pattern",
                equipment: ["rope"],
                priority: 2,
              },
              {
                name: "Альпинист",
                bodyPart: "cardio",
                movementPattern: "dynamic_plank",
                equipment: ["bodyweight"],
                priority: 3,
              },
              {
                name: "Планка",
                bodyPart: "core",
                movementPattern: "anti_extension",
                equipment: ["bodyweight"],
                priority: 4,
              },
              {
                name: "Подъем прямых ног лежа",
                bodyPart: "core",
                movementPattern: "hip_flexion",
                equipment: ["bodyweight"],
                priority: 5,
              },
            ],
          },
          {
            key: "conditioning_b",
            title: "День 2",
            emphasis: "Ноги, беговой паттерн и стабилизация",
            exercisePool: [
              {
                name: "Приседания с собственным весом",
                bodyPart: "legs",
                movementPattern: "squat",
                equipment: ["bodyweight"],
                priority: 1,
              },
              {
                name: "Зашагивания на скамью",
                bodyPart: "legs",
                movementPattern: "step_up",
                equipment: ["bench"],
                priority: 2,
              },
              {
                name: "Обратные выпады",
                bodyPart: "legs",
                movementPattern: "lunge",
                equipment: ["dumbbell"],
                priority: 3,
              },
              {
                name: "Бег с высоким подниманием колен",
                bodyPart: "cardio",
                movementPattern: "running_pattern",
                equipment: ["bodyweight"],
                priority: 4,
              },
              {
                name: "Боковая планка",
                bodyPart: "core",
                movementPattern: "anti_lateral_flexion",
                equipment: ["bodyweight"],
                priority: 5,
              },
            ],
          },
        ],
      },
    },
  },
];

const VERSION_FALLBACK_ORDER = ["5_days", "4_days", "3_days", "2_days"];

export function normalizeWorkoutsPerWeekValue(workoutsPerWeek, fallback = 3) {
  const numericValue = Number(workoutsPerWeek);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(numericValue), 2), 5);
}

function getVersionSortWeight(versionKey) {
  const parsedDays = Number(String(versionKey).replace("_days", ""));
  return Number.isFinite(parsedDays) ? parsedDays : 0;
}

export function getPlanVersionKey(plan = {}, workoutsPerWeek = 3) {
  const normalizedWorkoutsPerWeek =
    normalizeWorkoutsPerWeekValue(workoutsPerWeek);
  const expectedKey = `${normalizedWorkoutsPerWeek}_days`;
  const versions =
    plan?.versions && typeof plan.versions === "object" ? plan.versions : {};

  if (versions[expectedKey]) {
    return expectedKey;
  }

  const fallbackByOrder = VERSION_FALLBACK_ORDER.find(
    (versionKey) => versions[versionKey],
  );

  if (fallbackByOrder) {
    return fallbackByOrder;
  }

  const availableKeys = Object.keys(versions).sort(
    (left, right) => getVersionSortWeight(right) - getVersionSortWeight(left),
  );

  return availableKeys[0] ?? null;
}

export function getPlanVersion(plan = {}, workoutsPerWeek = 3) {
  const versionKey = getPlanVersionKey(plan, workoutsPerWeek);

  if (!versionKey) {
    return null;
  }

  return {
    key: versionKey,
    ...(plan.versions?.[versionKey] ?? {}),
  };
}

export function getPlanSessions(plan = {}, workoutsPerWeek = 3) {
  const version = getPlanVersion(plan, workoutsPerWeek);
  return Array.isArray(version?.sessions) ? version.sessions : [];
}
