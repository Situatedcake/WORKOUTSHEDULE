export const WORKOUTS_PER_WEEK_OPTIONS = [2, 3, 4, 5];
export const EXERCISES_PER_SESSION = 6;

const LEVEL_CONFIGS = {
  "Не определен": {
    warmup: "5-7 минут суставной разминки и легкого кардио",
    durationOffset: 0,
    prescriptions: {
      compound: "3 подхода по 8-10 повторений",
      isolation: "2-3 подхода по 10-12 повторений",
      cardio: "15-20 минут в умеренном темпе",
      core: "3 круга по 30-40 секунд",
    },
  },
  Начинающий: {
    warmup: "5-7 минут ходьбы, велотренажера или орбитрека",
    durationOffset: -5,
    prescriptions: {
      compound: "2-3 подхода по 10-12 повторений",
      isolation: "2 подхода по 12-15 повторений",
      cardio: "12-18 минут в ровном темпе",
      core: "2-3 круга по 30 секунд",
    },
  },
  Средний: {
    warmup: "7-10 минут кардио и динамической мобилизации",
    durationOffset: 5,
    prescriptions: {
      compound: "3-4 подхода по 8-12 повторений",
      isolation: "3 подхода по 10-15 повторений",
      cardio: "18-25 минут, включая интервалы",
      core: "3-4 круга по 40 секунд",
    },
  },
  Продвинутый: {
    warmup: "10 минут кардио, мобилизации и разминочных подходов",
    durationOffset: 12,
    prescriptions: {
      compound: "4-5 подходов по 6-10 повторений",
      isolation: "3-4 подхода по 10-15 повторений",
      cardio: "22-30 минут с темповыми отрезками",
      core: "4 круга по 45-60 секунд",
    },
  },
};

const FOCUS_LIBRARY = [
  {
    key: "upper-torso",
    label: "Верх торса",
    description: "Грудь, спина и руки с опорным днем на ноги и плечи.",
    sessions: [
      {
        key: "chest-triceps",
        title: "Грудь и трицепс",
        emphasis: "Толкающие мышцы верха тела",
        duration: 58,
        exercisePool: [
          { name: "Жим штанги лежа", type: "compound" },
          { name: "Жим гантелей под углом", type: "compound" },
          { name: "Сведения в кроссовере", type: "isolation" },
          { name: "Отжимания на брусьях", type: "compound" },
          { name: "Разгибание рук на блоке", type: "isolation" },
          { name: "Французский жим", type: "isolation" },
          { name: "Пуловер с гантелью", type: "isolation" },
          { name: "Отжимания узким хватом", type: "compound" },
          { name: "Разведения гантелей лежа", type: "isolation" },
        ],
      },
      {
        key: "back-biceps",
        title: "Спина и бицепс",
        emphasis: "Тяговые движения и объем рук",
        duration: 56,
        exercisePool: [
          { name: "Тяга верхнего блока", type: "compound" },
          { name: "Тяга штанги в наклоне", type: "compound" },
          { name: "Тяга горизонтального блока", type: "compound" },
          { name: "Подтягивания в гравитроне", type: "compound" },
          { name: "Подъем штанги на бицепс", type: "isolation" },
          { name: "Молотковые сгибания", type: "isolation" },
          { name: "Сгибания на скамье Скотта", type: "isolation" },
          { name: "Face pull", type: "isolation" },
          { name: "Тяга гантели к поясу", type: "compound" },
        ],
      },
      {
        key: "legs-shoulders",
        title: "Ноги и плечи",
        emphasis: "Баланс и силовая база",
        duration: 60,
        exercisePool: [
          { name: "Приседания", type: "compound" },
          { name: "Жим ногами", type: "compound" },
          { name: "Румынская тяга", type: "compound" },
          { name: "Выпады назад", type: "compound" },
          { name: "Жим сидя на плечи", type: "compound" },
          { name: "Подъем гантелей в стороны", type: "isolation" },
          { name: "Тяга к подбородку", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Ягодичный мост", type: "compound" },
        ],
      },
      {
        key: "upper-volume",
        title: "Верх тела объемом",
        emphasis: "Добивка груди, спины и рук",
        duration: 55,
        exercisePool: [
          { name: "Жим в хаммере", type: "compound" },
          { name: "Тяга гантелей в наклоне", type: "compound" },
          { name: "Разведения в тренажере", type: "isolation" },
          { name: "Пулдаун прямыми руками", type: "isolation" },
          { name: "Сгибания в кроссовере", type: "isolation" },
          { name: "Разгибание из-за головы с канатом", type: "isolation" },
          { name: "Отжимания от пола", type: "compound" },
          { name: "Гиперэкстензия", type: "core" },
          { name: "Планка", type: "core" },
        ],
      },
      {
        key: "mixed-focus",
        title: "Смешанный день",
        emphasis: "Поддержка общей формы",
        duration: 52,
        exercisePool: [
          { name: "Тяга к поясу", type: "compound" },
          { name: "Жим гантелей сидя", type: "compound" },
          { name: "Болгарские выпады", type: "compound" },
          { name: "Разведения в наклоне", type: "isolation" },
          { name: "Скручивания", type: "core" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Сведения в кроссовере сверху вниз", type: "isolation" },
          { name: "Подъем EZ-штанги на бицепс", type: "isolation" },
          { name: "Отжимания на скамье", type: "compound" },
        ],
      },
    ],
  },
  {
    key: "endurance",
    label: "Выносливость",
    description: "Больше кардио, круговой работы и устойчивости к нагрузке.",
    sessions: [
      {
        key: "aerobic-base",
        title: "Аэробная база",
        emphasis: "Ровная кардио-нагрузка",
        duration: 45,
        exercisePool: [
          { name: "Беговая дорожка", type: "cardio" },
          { name: "Велотренажер", type: "cardio" },
          { name: "Эллипс", type: "cardio" },
          { name: "Планка", type: "core" },
          { name: "Скручивания", type: "core" },
          { name: "Приседания с собственным весом", type: "compound" },
          { name: "Шаги на платформу", type: "compound" },
          { name: "Фермерская прогулка", type: "compound" },
        ],
      },
      {
        key: "circuit-strength",
        title: "Силовая выносливость",
        emphasis: "Круговой формат",
        duration: 50,
        exercisePool: [
          { name: "Жим гантелей лежа", type: "compound" },
          { name: "Тяга верхнего блока", type: "compound" },
          { name: "Выпады", type: "compound" },
          { name: "Берпи", type: "cardio" },
          { name: "Подъем коленей в висе", type: "core" },
          { name: "Гребной тренажер", type: "cardio" },
          { name: "Жим ногами", type: "compound" },
          { name: "Скакалка", type: "cardio" },
        ],
      },
      {
        key: "legs-core",
        title: "Ноги и корпус",
        emphasis: "Устойчивость и контроль",
        duration: 48,
        exercisePool: [
          { name: "Жим ногами", type: "compound" },
          { name: "Румынская тяга", type: "compound" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Русские повороты", type: "core" },
          { name: "Прыжки на тумбу", type: "cardio" },
          { name: "Скручивания", type: "core" },
        ],
      },
      {
        key: "tempo-day",
        title: "Темповая работа",
        emphasis: "Интервалы и пульс",
        duration: 44,
        exercisePool: [
          { name: "Air bike", type: "cardio" },
          { name: "Беговые интервалы", type: "cardio" },
          { name: "Скакалка", type: "cardio" },
          { name: "Планка с касанием плеч", type: "core" },
          { name: "Тяга гантели к поясу", type: "compound" },
          { name: "Приседания с гантелью", type: "compound" },
          { name: "Гиперэкстензия", type: "core" },
          { name: "Шаги на платформу", type: "compound" },
        ],
      },
      {
        key: "recovery-flow",
        title: "Восстановительный объем",
        emphasis: "Мягкая поддержка формы",
        duration: 40,
        exercisePool: [
          { name: "Ходьба под уклоном", type: "cardio" },
          { name: "Велотренажер", type: "cardio" },
          { name: "Планка", type: "core" },
          { name: "Bird dog", type: "core" },
          { name: "Гоблет-присед", type: "compound" },
          { name: "Тяга каната к лицу", type: "isolation" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
        ],
      },
    ],
  },
  {
    key: "arms",
    label: "Руки",
    description: "Фокус на бицепс, трицепс и дополнительный объем верха тела.",
    sessions: [
      {
        key: "biceps-triceps",
        title: "Бицепс и трицепс",
        emphasis: "Прямой акцент на руки",
        duration: 46,
        exercisePool: [
          { name: "Подъем штанги на бицепс", type: "isolation" },
          { name: "Молотковые сгибания", type: "isolation" },
          { name: "Сгибания на скамье Скотта", type: "isolation" },
          { name: "Французский жим", type: "isolation" },
          { name: "Разгибание рук на блоке", type: "isolation" },
          { name: "Разгибание из-за головы с гантелью", type: "isolation" },
          { name: "Отжимания узким хватом", type: "compound" },
          { name: "Отжимания на брусьях", type: "compound" },
        ],
      },
      {
        key: "push-support",
        title: "Грудь и плечи",
        emphasis: "Поддержка рук через жим",
        duration: 52,
        exercisePool: [
          { name: "Жим штанги лежа", type: "compound" },
          { name: "Жим гантелей под углом", type: "compound" },
          { name: "Жим сидя на плечи", type: "compound" },
          { name: "Разведения гантелей в стороны", type: "isolation" },
          { name: "Сведения в кроссовере", type: "isolation" },
          { name: "Отжимания", type: "compound" },
          { name: "Face pull", type: "isolation" },
          { name: "Планка", type: "core" },
        ],
      },
      {
        key: "pull-support",
        title: "Спина и хват",
        emphasis: "Тяговая база для рук",
        duration: 50,
        exercisePool: [
          { name: "Тяга верхнего блока", type: "compound" },
          { name: "Тяга штанги в наклоне", type: "compound" },
          { name: "Тяга горизонтального блока", type: "compound" },
          { name: "Подтягивания в гравитроне", type: "compound" },
          { name: "Шраги", type: "isolation" },
          { name: "Сгибания обратным хватом", type: "isolation" },
          { name: "Фермерская прогулка", type: "compound" },
          { name: "Скручивания", type: "core" },
        ],
      },
      {
        key: "legs-balance",
        title: "Ноги и баланс",
        emphasis: "Поддержка общей формы",
        duration: 48,
        exercisePool: [
          { name: "Жим ногами", type: "compound" },
          { name: "Приседания", type: "compound" },
          { name: "Выпады", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Румынская тяга", type: "compound" },
          { name: "Планка", type: "core" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Ягодичный мост", type: "compound" },
        ],
      },
      {
        key: "pump-day",
        title: "Пампинг рук",
        emphasis: "Дополнительный объем",
        duration: 45,
        exercisePool: [
          { name: "Сгибания в кроссовере", type: "isolation" },
          { name: "Концентрированные сгибания", type: "isolation" },
          { name: "Разгибание канатом", type: "isolation" },
          { name: "Отжимания на скамье", type: "compound" },
          { name: "Французский жим сидя", type: "isolation" },
          { name: "Подъем EZ-штанги на бицепс", type: "isolation" },
          { name: "Молотки попеременно", type: "isolation" },
          { name: "Планка с касанием плеч", type: "core" },
        ],
      },
    ],
  },
  {
    key: "fat-loss",
    label: "Снижение веса",
    description: "Силовая работа плюс энергозатратные блоки.",
    sessions: [
      {
        key: "metabolic-fullbody",
        title: "Метаболическая силовая",
        emphasis: "Все тело",
        duration: 50,
        exercisePool: [
          { name: "Приседания с гантелью", type: "compound" },
          { name: "Жим гантелей лежа", type: "compound" },
          { name: "Тяга верхнего блока", type: "compound" },
          { name: "Берпи", type: "cardio" },
          { name: "Гребной тренажер", type: "cardio" },
          { name: "Скручивания", type: "core" },
          { name: "Шаги на платформу", type: "compound" },
          { name: "Планка", type: "core" },
        ],
      },
      {
        key: "lower-body-burn",
        title: "Ноги и расход калорий",
        emphasis: "Крупные мышечные группы",
        duration: 52,
        exercisePool: [
          { name: "Жим ногами", type: "compound" },
          { name: "Выпады", type: "compound" },
          { name: "Румынская тяга", type: "compound" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Беговые интервалы", type: "cardio" },
          { name: "Скручивания", type: "core" },
          { name: "Подъем ног лежа", type: "core" },
        ],
      },
      {
        key: "interval-day",
        title: "Интервальный день",
        emphasis: "Пульс и дефицит",
        duration: 42,
        exercisePool: [
          { name: "Air bike", type: "cardio" },
          { name: "Беговая дорожка", type: "cardio" },
          { name: "Скакалка", type: "cardio" },
          { name: "Прыжки на тумбу", type: "cardio" },
          { name: "Планка с касанием плеч", type: "core" },
          { name: "Русские повороты", type: "core" },
          { name: "Шаги на платформу", type: "compound" },
          { name: "Фермерская прогулка", type: "compound" },
        ],
      },
      {
        key: "upper-maintain",
        title: "Поддержка верха тела",
        emphasis: "Сохранение мышечной массы",
        duration: 48,
        exercisePool: [
          { name: "Жим лежа", type: "compound" },
          { name: "Тяга горизонтального блока", type: "compound" },
          { name: "Жим сидя на плечи", type: "compound" },
          { name: "Face pull", type: "isolation" },
          { name: "Разгибание рук на блоке", type: "isolation" },
          { name: "Молотковые сгибания", type: "isolation" },
          { name: "Скручивания", type: "core" },
          { name: "Гребной тренажер", type: "cardio" },
        ],
      },
      {
        key: "recovery-cardio",
        title: "Легкий кардио-день",
        emphasis: "Восстановление и движение",
        duration: 38,
        exercisePool: [
          { name: "Ходьба под уклоном", type: "cardio" },
          { name: "Эллипс", type: "cardio" },
          { name: "Bird dog", type: "core" },
          { name: "Гиперэкстензия", type: "core" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Планка", type: "core" },
          { name: "Выпады назад", type: "compound" },
        ],
      },
    ],
  },
  {
    key: "full-body",
    label: "Фуллбади",
    description: "Полноценные тренировки на все тело с балансом силы, техники и выносливости.",
    sessions: [
      {
        key: "full-body-strength",
        title: "Фуллбади: базовая сила",
        emphasis: "Ноги, грудь и спина в одной сессии",
        duration: 58,
        exercisePool: [
          { name: "Приседания", type: "compound" },
          { name: "Жим штанги лежа", type: "compound" },
          { name: "Тяга верхнего блока", type: "compound" },
          { name: "Жим сидя на плечи", type: "compound" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Планка", type: "core" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Face pull", type: "isolation" },
        ],
      },
      {
        key: "full-body-volume",
        title: "Фуллбади: объем",
        emphasis: "Больше повторений и плотности",
        duration: 54,
        exercisePool: [
          { name: "Жим гантелей лежа", type: "compound" },
          { name: "Тяга горизонтального блока", type: "compound" },
          { name: "Болгарские выпады", type: "compound" },
          { name: "Разведения гантелей в стороны", type: "isolation" },
          { name: "Скручивания", type: "core" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Отжимания", type: "compound" },
          { name: "Фермерская прогулка", type: "compound" },
        ],
      },
      {
        key: "full-body-conditioning",
        title: "Фуллбади: кондиции",
        emphasis: "Силовой темп и пульс",
        duration: 50,
        exercisePool: [
          { name: "Приседания с гантелью", type: "compound" },
          { name: "Тяга гантели к поясу", type: "compound" },
          { name: "Отжимания", type: "compound" },
          { name: "Гребной тренажер", type: "cardio" },
          { name: "Скакалка", type: "cardio" },
          { name: "Планка с касанием плеч", type: "core" },
          { name: "Шаги на платформу", type: "compound" },
          { name: "Bird dog", type: "core" },
        ],
      },
      {
        key: "full-body-recovery",
        title: "Фуллбади: восстановление",
        emphasis: "Легче по нагрузке, чище по технике",
        duration: 44,
        exercisePool: [
          { name: "Ходьба под уклоном", type: "cardio" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Жим ногами", type: "compound" },
          { name: "Тяга каната к лицу", type: "isolation" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Гиперэкстензия", type: "core" },
          { name: "Планка", type: "core" },
          { name: "Эллипс", type: "cardio" },
        ],
      },
    ],
  },
  {
    key: "women-cardio",
    label: "Кардио для девушек",
    description: "Кардио-сессии с упором на ноги, ягодицы, корпус и общий тонус.",
    sessions: [
      {
        key: "women-cardio-burn",
        title: "Кардио и тонус",
        emphasis: "Пульс, ноги и общий расход",
        duration: 46,
        exercisePool: [
          { name: "Беговая дорожка", type: "cardio" },
          { name: "Эллипс", type: "cardio" },
          { name: "Шаги на платформу", type: "compound" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Планка", type: "core" },
          { name: "Скручивания", type: "core" },
          { name: "Скакалка", type: "cardio" },
        ],
      },
      {
        key: "women-cardio-legs",
        title: "Ноги и ягодицы",
        emphasis: "Нижняя часть тела и кардио-блок",
        duration: 50,
        exercisePool: [
          { name: "Выпады", type: "compound" },
          { name: "Жим ногами", type: "compound" },
          { name: "Приседания с собственным весом", type: "compound" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Велотренажер", type: "cardio" },
          { name: "Планка с касанием плеч", type: "core" },
          { name: "Русские повороты", type: "core" },
        ],
      },
      {
        key: "women-cardio-intervals",
        title: "Интервальное кардио",
        emphasis: "Темп, выносливость и дефицит",
        duration: 42,
        exercisePool: [
          { name: "Air bike", type: "cardio" },
          { name: "Беговые интервалы", type: "cardio" },
          { name: "Скакалка", type: "cardio" },
          { name: "Прыжки на тумбу", type: "cardio" },
          { name: "Шаги на платформу", type: "compound" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Планка", type: "core" },
          { name: "Bird dog", type: "core" },
        ],
      },
      {
        key: "women-cardio-recovery",
        title: "Легкий кардио-день",
        emphasis: "Восстановление и мягкая активность",
        duration: 38,
        exercisePool: [
          { name: "Ходьба под уклоном", type: "cardio" },
          { name: "Велотренажер", type: "cardio" },
          { name: "Эллипс", type: "cardio" },
          { name: "Bird dog", type: "core" },
          { name: "Гиперэкстензия", type: "core" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Ягодичный мост", type: "compound" },
          { name: "Планка", type: "core" },
        ],
      },
    ],
  },
  {
    key: "general-strength",
    label: "Общая сила",
    description: "Базовый универсальный план для уверенного прогресса.",
    sessions: [
      {
        key: "push-day",
        title: "Толкающий день",
        emphasis: "Грудь, плечи, трицепс",
        duration: 54,
        exercisePool: [
          { name: "Жим штанги лежа", type: "compound" },
          { name: "Жим гантелей под углом", type: "compound" },
          { name: "Жим сидя на плечи", type: "compound" },
          { name: "Разведения гантелей в стороны", type: "isolation" },
          { name: "Разгибание рук на блоке", type: "isolation" },
          { name: "Отжимания", type: "compound" },
          { name: "Планка", type: "core" },
          { name: "Сведения в кроссовере", type: "isolation" },
        ],
      },
      {
        key: "pull-day",
        title: "Тяговый день",
        emphasis: "Спина и бицепс",
        duration: 55,
        exercisePool: [
          { name: "Тяга верхнего блока", type: "compound" },
          { name: "Тяга штанги в наклоне", type: "compound" },
          { name: "Тяга горизонтального блока", type: "compound" },
          { name: "Подтягивания в гравитроне", type: "compound" },
          { name: "Молотковые сгибания", type: "isolation" },
          { name: "Подъем штанги на бицепс", type: "isolation" },
          { name: "Face pull", type: "isolation" },
          { name: "Гиперэкстензия", type: "core" },
        ],
      },
      {
        key: "lower-day",
        title: "Ноги и корпус",
        emphasis: "Силовая база",
        duration: 58,
        exercisePool: [
          { name: "Приседания", type: "compound" },
          { name: "Жим ногами", type: "compound" },
          { name: "Румынская тяга", type: "compound" },
          { name: "Выпады", type: "compound" },
          { name: "Подъем на носки", type: "isolation" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Скручивания", type: "core" },
          { name: "Ягодичный мост", type: "compound" },
        ],
      },
      {
        key: "mix-day",
        title: "Смешанный день",
        emphasis: "Поддержка общей формы",
        duration: 50,
        exercisePool: [
          { name: "Жим гантелей лежа", type: "compound" },
          { name: "Тяга гантели к поясу", type: "compound" },
          { name: "Болгарские выпады", type: "compound" },
          { name: "Подъем гантелей в стороны", type: "isolation" },
          { name: "Разгибание рук на блоке", type: "isolation" },
          { name: "Сгибания на бицепс", type: "isolation" },
          { name: "Планка", type: "core" },
          { name: "Фермерская прогулка", type: "compound" },
        ],
      },
      {
        key: "conditioning-day",
        title: "Силовой финишер",
        emphasis: "Форма и выносливость",
        duration: 46,
        exercisePool: [
          { name: "Гребной тренажер", type: "cardio" },
          { name: "Отжимания", type: "compound" },
          { name: "Приседания с гантелью", type: "compound" },
          { name: "Face pull", type: "isolation" },
          { name: "Скручивания", type: "core" },
          { name: "Подъем ног лежа", type: "core" },
          { name: "Скакалка", type: "cardio" },
          { name: "Тяга верхнего блока", type: "compound" },
        ],
      },
    ],
  },
];

export const TRAINING_GOALS = FOCUS_LIBRARY.map(
  ({ key, label, description }) => ({
    key,
    label,
    description,
  }),
);

/*
const TRAINING_SETUP_RECOMMENDATIONS = {
  "РќРµ РѕРїСЂРµРґРµР»РµРЅ": {
    workoutsPerWeek: 3,
    focusKey: "general-strength",
    reason:
      "РЎР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРЅР°СЏ РїСЂРѕРіСЂР°РјРјР° РґР»СЏ СЃС‚Р°СЂС‚Р° Рё РїРѕРґР±РѕСЂР° РЅР°РіСЂСѓР·РєРё.",
  },
  РќР°С‡РёРЅР°СЋС‰РёР№: {
    workoutsPerWeek: 3,
    focusKey: "general-strength",
    reason:
      "РЈСЂРѕРІРµРЅСЊ РїРѕРґСЃРєР°Р·С‹РІР°РµС‚, С‡С‚Рѕ Р»СѓС‡С€Рµ РЅР°С‡Р°С‚СЊ СЃ Р±Р°Р·РѕРІРѕР№ Рё СѓСЃС‚РѕР№С‡РёРІРѕР№ РїСЂРѕРіСЂР°РјРјС‹.",
  },
  РЎСЂРµРґРЅРёР№: {
    workoutsPerWeek: 4,
    focusKey: "upper-torso",
    reason:
      "РњРѕР¶РЅРѕ РїРѕРґРЅСЏС‚СЊ С‡Р°СЃС‚РѕС‚Сѓ С‚СЂРµРЅРёСЂРѕРІРѕРє Рё РґР°С‚СЊ Р±РѕР»СЊС€Рµ РѕР±СЉРµРјР° РІРµСЂС…Сѓ С‚РµР»Р°.",
  },
  РџСЂРѕРґРІРёРЅСѓС‚С‹Р№: {
    workoutsPerWeek: 5,
    focusKey: "upper-torso",
    reason:
      "РЈСЂРѕРІРµРЅСЊ РїРѕР·РІРѕР»СЏРµС‚ Р·Р°Р№С‚Рё РІ Р±РѕР»РµРµ С‡Р°СЃС‚С‹Р№ СЃРїР»РёС‚ СЃ Р±РѕР»СЊС€РёРј РѕР±СЉРµРјРѕРј.",
  },
};
*/

const [
  UNDEFINED_TRAINING_LEVEL,
  BEGINNER_TRAINING_LEVEL,
  INTERMEDIATE_TRAINING_LEVEL,
  ADVANCED_TRAINING_LEVEL,
] = Object.keys(LEVEL_CONFIGS);

const LEVEL_PRESCRIPTION_DETAILS = {
  [UNDEFINED_TRAINING_LEVEL]: {
    compound: { sets: 3, repRange: "8-10", restSeconds: 120 },
    isolation: { sets: 3, repRange: "10-12", restSeconds: 75 },
    cardio: { sets: 1, repRange: "15-20 мин", restSeconds: 30 },
    core: { sets: 3, repRange: "30-40 сек", restSeconds: 45 },
  },
  [BEGINNER_TRAINING_LEVEL]: {
    compound: { sets: 3, repRange: "10-12", restSeconds: 120 },
    isolation: { sets: 2, repRange: "12-15", restSeconds: 60 },
    cardio: { sets: 1, repRange: "12-18 мин", restSeconds: 30 },
    core: { sets: 3, repRange: "30 сек", restSeconds: 45 },
  },
  [INTERMEDIATE_TRAINING_LEVEL]: {
    compound: { sets: 4, repRange: "8-12", restSeconds: 150 },
    isolation: { sets: 3, repRange: "10-15", restSeconds: 75 },
    cardio: { sets: 1, repRange: "18-25 мин", restSeconds: 30 },
    core: { sets: 4, repRange: "40-50 сек", restSeconds: 45 },
  },
  [ADVANCED_TRAINING_LEVEL]: {
    compound: { sets: 5, repRange: "6-10", restSeconds: 180 },
    isolation: { sets: 4, repRange: "10-15", restSeconds: 90 },
    cardio: { sets: 1, repRange: "22-30 мин", restSeconds: 30 },
    core: { sets: 4, repRange: "45-60 сек", restSeconds: 60 },
  },
};

function formatRestDuration(restSeconds) {
  const normalizedRestSeconds = Math.max(Number(restSeconds) || 0, 0);

  if (normalizedRestSeconds >= 60) {
    const restMinutes = Math.floor(normalizedRestSeconds / 60);
    const restRemainderSeconds = normalizedRestSeconds % 60;

    if (!restRemainderSeconds) {
      return `${restMinutes} мин`;
    }

    return `${restMinutes} мин ${restRemainderSeconds} сек`;
  }

  return `${normalizedRestSeconds} сек`;
}

export function formatExercisePrescription({
  exerciseType,
  sets,
  repRange,
  restSeconds,
}) {
  if (exerciseType === "cardio") {
    return `${sets} блок • ${repRange} • отдых ${formatRestDuration(restSeconds)}`;
  }

  return `${sets} подход. • ${repRange} • отдых ${formatRestDuration(restSeconds)}`;
}

export function getExerciseVolumeReason(exercise) {
  if (typeof exercise?.volumeReason === "string" && exercise.volumeReason.trim()) {
    return exercise.volumeReason;
  }

  if (exercise?.volumeTrend === "progressing") {
    return "Объём усилен, потому что по упражнению уже виден рабочий прогресс.";
  }

  if (exercise?.volumeTrend === "stalled") {
    return "Объём смягчён и смещён в сторону более контролируемой работы из-за плато.";
  }

  if (exercise?.volumeTrend === "manual") {
    return "Объём скорректирован вручную, поэтому система показывает уже обновлённую версию плана.";
  }

  return "Базовый объём подобран по текущему уровню подготовки и типу упражнения.";
}

function formatSetDelta(delta) {
  const absoluteDelta = Math.abs(delta);
  const suffix =
    absoluteDelta === 1
      ? "подход"
      : absoluteDelta >= 2 && absoluteDelta <= 4
        ? "подхода"
        : "подходов";

  return `${delta > 0 ? "+" : "-"}${absoluteDelta} ${suffix}`;
}

function formatRestDelta(delta) {
  return `отдых ${delta > 0 ? "+" : "-"}${formatRestDuration(Math.abs(delta))}`;
}

export function getExerciseVolumeReasonTitle(exercise) {
  if (exercise?.volumeTrend === "progressing") {
    return "Добавили объём из-за прогресса";
  }

  if (exercise?.volumeTrend === "stalled") {
    return "Смягчили объём из-за плато";
  }

  if (exercise?.volumeTrend === "manual") {
    return "Объём скорректирован вручную";
  }

  return "Базовый объём под твой уровень";
}

export function getExerciseVolumeChangeChips(exercise, trainingLevel) {
  const baseDetails = getExercisePrescriptionDetails(
    trainingLevel,
    exercise?.type ?? "compound",
  );
  const currentSets = Number(exercise?.sets) || baseDetails.sets;
  const currentRepRange =
    typeof exercise?.repRange === "string" && exercise.repRange.trim()
      ? exercise.repRange
      : baseDetails.repRange;
  const currentRestSeconds =
    Number(exercise?.restSeconds) || baseDetails.restSeconds;
  const chips = [];
  const setDelta = currentSets - baseDetails.sets;
  const restDelta = currentRestSeconds - baseDetails.restSeconds;

  if (setDelta !== 0) {
    chips.push(formatSetDelta(setDelta));
  }

  if (currentRepRange !== baseDetails.repRange) {
    chips.push(`повторы ${currentRepRange}`);
  }

  if (restDelta !== 0) {
    chips.push(formatRestDelta(restDelta));
  }

  if (chips.length > 0) {
    return chips;
  }

  if (exercise?.volumeTrend === "manual") {
    return ["ручная правка"];
  }

  return ["базовый объём"];
}

export function getExerciseVolumeReasonMeta(exercise) {
  if (exercise?.volumeTrend === "progressing") {
    return {
      label: "Прогресс",
      iconType: "progressing",
      surfaceClassName: "border border-[#1D5E4F] bg-[#0D2E28]",
      badgeClassName: "bg-[#0D3A33] text-[#B5F7DF]",
      textClassName: "text-[#C8F5E5]",
    };
  }

  if (exercise?.volumeTrend === "stalled") {
    return {
      label: "Плато",
      iconType: "stalled",
      surfaceClassName: "border border-[#5E4B1D] bg-[#2E2510]",
      badgeClassName: "bg-[#4B3A11] text-[#FFD98A]",
      textClassName: "text-[#F3D9A1]",
    };
  }

  if (exercise?.volumeTrend === "manual") {
    return {
      label: "Вручную",
      iconType: "manual",
      surfaceClassName: "border border-[#264D79] bg-[#122033]",
      badgeClassName: "bg-[#183B63] text-[#A7D3FF]",
      textClassName: "text-[#B8D9FF]",
    };
  }

  return {
    label: "База",
    iconType: "base",
    surfaceClassName: "border border-[#2A3140] bg-[#0B0E15]",
    badgeClassName: "bg-[#1D222D] text-[#D7DEEA]",
    textClassName: "text-[#B8C1D1]",
  };
}

export function getTrainingPlanAdaptationHighlights(trainingPlan, limit = 4) {
  if (!trainingPlan?.sessions?.length) {
    return [];
  }

  return trainingPlan.sessions
    .flatMap((session) =>
      (session.exercises ?? []).map((exercise) => ({
        sessionId: session.id,
        sessionTitle: session.title,
        exercise,
        meta: getExerciseVolumeReasonMeta(exercise),
        reasonTitle: getExerciseVolumeReasonTitle(exercise),
        chips: getExerciseVolumeChangeChips(
          exercise,
          trainingPlan.trainingLevel,
        ),
      })),
    )
    .filter(
      (item) => item.exercise?.volumeTrend && item.exercise.volumeTrend !== "base",
    )
    .slice(0, limit);
}

export function getTrainingPlanAdaptationBreakdown(trainingPlan) {
  const result = {
    progressing: 0,
    stalled: 0,
    manual: 0,
    base: 0,
  };

  (trainingPlan?.sessions ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((exercise) => {
      const trend = exercise?.volumeTrend ?? "base";
      result[trend] = (result[trend] ?? 0) + 1;
    });
  });

  return [
    {
      key: "progressing",
      count: result.progressing,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "progressing" }),
    },
    {
      key: "stalled",
      count: result.stalled,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "stalled" }),
    },
    {
      key: "manual",
      count: result.manual,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "manual" }),
    },
    {
      key: "base",
      count: result.base,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "base" }),
    },
  ];
}

const DEFAULT_TRAINING_SETUP = {
  workoutsPerWeek: 3,
  focusKey: "general-strength",
  reason:
    "Сбалансированная программа для старта и подбора рабочей нагрузки.",
};

export function getLevelConfig(trainingLevel) {
  return LEVEL_CONFIGS[trainingLevel] ?? LEVEL_CONFIGS["Не определен"];
}

export function getExercisePrescriptionDetails(trainingLevel, exerciseType) {
  const levelDetails =
    LEVEL_PRESCRIPTION_DETAILS[trainingLevel] ??
    LEVEL_PRESCRIPTION_DETAILS[UNDEFINED_TRAINING_LEVEL];
  const resolvedType = typeof exerciseType === "string" ? exerciseType : "compound";
  const baseDetails = levelDetails[resolvedType] ?? levelDetails.compound;

  return {
    ...baseDetails,
    prescription: formatExercisePrescription({
      exerciseType: resolvedType,
      sets: baseDetails.sets,
      repRange: baseDetails.repRange,
      restSeconds: baseDetails.restSeconds,
    }),
  };
}

export function getExercisePrescription(trainingLevel, exerciseType) {
  return getExercisePrescriptionDetails(trainingLevel, exerciseType).prescription;
}

function getFocusDefinition(focusKey) {
  return FOCUS_LIBRARY.find((goal) => goal.key === focusKey) ?? FOCUS_LIBRARY[0];
}

function normalizeWorkoutsPerWeek(workoutsPerWeek) {
  return Math.min(Math.max(Number(workoutsPerWeek) || 3, 2), 5);
}

function createPlanId(focusKey) {
  return `plan_${Date.now()}_${focusKey}`;
}

export function getRecommendedTrainingSetup(trainingLevel) {
  if (trainingLevel === "Продвинутый") {
    return {
      workoutsPerWeek: 5,
      focusKey: "upper-torso",
      reason:
        "Уровень позволяет зайти в более частый сплит с большим объемом работы.",
    };
  }

  if (trainingLevel === "Средний") {
    return {
      workoutsPerWeek: 4,
      focusKey: "upper-torso",
      reason:
        "Можно поднять частоту тренировок и дать больше объема верху тела.",
    };
  }

  if (trainingLevel === "Начинающий") {
    return {
      workoutsPerWeek: 3,
      focusKey: "general-strength",
      reason:
        "Лучше начать с базовой и устойчивой программы без лишнего объема.",
    };
  }

  return DEFAULT_TRAINING_SETUP;
/*
  return (
    TRAINING_SETUP_RECOMMENDATIONS[trainingLevel] ??
    TRAINING_SETUP_RECOMMENDATIONS["РќРµ РѕРїСЂРµРґРµР»РµРЅ"]
  );
*/
}

function createDraftSession(planId, template, index, trainingLevel) {
  const levelConfig = getLevelConfig(trainingLevel);
  const defaultSelection = template.exercisePool
    .slice(0, EXERCISES_PER_SESSION)
    .map((exercise) => exercise.name);

  return {
    id: `${planId}_session_${index + 1}`,
    key: template.key,
    index: index + 1,
    dayLabel: `Тренировка ${index + 1}`,
    title: template.title,
    emphasis: template.emphasis,
    estimatedDurationMin: Math.max(template.duration + levelConfig.durationOffset, 35),
    warmup: levelConfig.warmup,
    availableExercises: template.exercisePool.map((exercise) => exercise.name),
    exerciseOptions: template.exercisePool.map((exercise) => ({
      name: exercise.name,
      type: exercise.type,
    })),
    selectedExerciseNames: defaultSelection,
  };
}

function buildExerciseMap(template) {
  return template.exercisePool.reduce((map, exercise) => {
    map.set(exercise.name, exercise);
    return map;
  }, new Map());
}

function normalizeSelectedExercises(selectedExerciseNames, template) {
  const exerciseMap = buildExerciseMap(template);
  const validSelected = Array.isArray(selectedExerciseNames)
    ? selectedExerciseNames.filter(
        (exerciseName, index, array) =>
          typeof exerciseName === "string" &&
          exerciseMap.has(exerciseName) &&
          array.indexOf(exerciseName) === index,
      )
    : [];

  if (validSelected.length >= EXERCISES_PER_SESSION) {
    return validSelected.slice(0, EXERCISES_PER_SESSION);
  }

  const fallbackExercises = template.exercisePool
    .map((exercise) => exercise.name)
    .filter((exerciseName) => !validSelected.includes(exerciseName))
    .slice(0, EXERCISES_PER_SESSION - validSelected.length);

  return [...validSelected, ...fallbackExercises];
}

export function createTrainingPlanDraft({
  workoutsPerWeek,
  focusKey,
  trainingLevel,
}) {
  const normalizedWorkoutsPerWeek = normalizeWorkoutsPerWeek(workoutsPerWeek);
  const focusDefinition = getFocusDefinition(focusKey);
  const planId = createPlanId(focusDefinition.key);

  return Array.from({ length: normalizedWorkoutsPerWeek }, (_, index) => {
    const template = focusDefinition.sessions[index % focusDefinition.sessions.length];
    return createDraftSession(planId, template, index, trainingLevel);
  });
}

export function buildTrainingPlan({
  workoutsPerWeek,
  focusKey,
  trainingLevel,
  sessionSelections = [],
}) {
  const normalizedTrainingLevel = trainingLevel || "Не определен";
  const focusDefinition = getFocusDefinition(focusKey);
  const planId = createPlanId(focusDefinition.key);
  const draftSessions = createTrainingPlanDraft({
    workoutsPerWeek,
    focusKey: focusDefinition.key,
    trainingLevel: normalizedTrainingLevel,
  });
  const levelConfig = getLevelConfig(normalizedTrainingLevel);

  const sessions = draftSessions.map((draftSession, index) => {
    const template = focusDefinition.sessions[index % focusDefinition.sessions.length];
    const selectedExerciseNames = normalizeSelectedExercises(
      sessionSelections[index]?.selectedExerciseNames ??
        draftSession.selectedExerciseNames,
      template,
    );
    const exerciseMap = buildExerciseMap(template);

    return {
      id: `${planId}_session_${index + 1}`,
      key: template.key,
      index: index + 1,
      dayLabel: `Тренировка ${index + 1}`,
      title: template.title,
      emphasis: template.emphasis,
      estimatedDurationMin: draftSession.estimatedDurationMin,
      warmup: levelConfig.warmup,
      availableExercises: template.exercisePool.map((exercise) => exercise.name),
      exerciseOptions: template.exercisePool.map((exercise) => ({
        name: exercise.name,
        type: exercise.type,
      })),
      completed: false,
      exercises: selectedExerciseNames.map((exerciseName) => {
        const exercise = exerciseMap.get(exerciseName);
        const prescriptionDetails = getExercisePrescriptionDetails(
          normalizedTrainingLevel,
          exercise.type,
        );
        return {
          name: exercise.name,
          type: exercise.type,
          sets: prescriptionDetails.sets,
          repRange: prescriptionDetails.repRange,
          restSeconds: prescriptionDetails.restSeconds,
          prescription: prescriptionDetails.prescription,
          volumeTrend: "base",
          volumeReason:
            "Базовый объём подобран по текущему уровню подготовки и типу упражнения.",
        };
      }),
    };
  });

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    focusKey: focusDefinition.key,
    focusLabel: focusDefinition.label,
    focusDescription: focusDefinition.description,
    workoutsPerWeek: sessions.length,
    trainingLevel: normalizedTrainingLevel,
    estimatedMinutesPerWeek: sessions.reduce(
      (total, session) => total + session.estimatedDurationMin,
      0,
    ),
    sessions,
  };
}
