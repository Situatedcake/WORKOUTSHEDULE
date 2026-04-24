import { useEffect, useMemo, useState } from "react";
import LoadingCard from "../components/LoadingCard";
import PageBackButton from "../components/PageBackButton";
import PageShell from "../components/PageShell";
import { DATABASE_CONFIG } from "../services/database/databaseConfig";

const BODY_PART_ORDER = [
  "full_body",
  "chest",
  "upper_chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "cardio",
];

function getDifficultyMeta(level) {
  switch (Number(level)) {
    case 1:
      return {
        label: "Легкое",
        badgeClassName:
          "border border-[#2A6A45] bg-[#143423] text-[#8CF0B8]",
      };
    case 2:
      return {
        label: "Среднее",
        badgeClassName:
          "border border-[#6E5420] bg-[#3A2C10] text-[#F6D27D]",
      };
    case 3:
      return {
        label: "Сложное",
        badgeClassName:
          "border border-[#7B2A32] bg-[#3A1418] text-[#FFB2B9]",
      };
    default:
      return {
        label: "Без уровня",
        badgeClassName:
          "border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-muted)]",
      };
  }
}

function getBodyPartLabel(bodyPart) {
  switch (bodyPart) {
    case "chest":
      return "Грудь";
    case "upper_chest":
      return "Верх груди";
    case "back":
      return "Спина";
    case "legs":
      return "Ноги";
    case "shoulders":
      return "Плечи";
    case "arms":
      return "Руки";
    case "core":
      return "Кор";
    case "cardio":
      return "Кардио";
    case "full_body":
      return "Все тело";
    default:
      return "Другое";
  }
}

function getEquipmentLabel(equipment) {
  switch (equipment) {
    case "barbell":
      return "Штанга";
    case "dumbbell":
      return "Гантели";
    case "machine":
      return "Тренажер";
    case "bench":
      return "Скамья";
    case "rope":
      return "Канат";
    case "kettlebell":
      return "Гиря";
    case "bodyweight":
      return "Вес тела";
    case null:
    case undefined:
    case "":
      return "Без инвентаря";
    default:
      return equipment;
  }
}

function getTypeLabel(type) {
  switch (type) {
    case "strength":
      return "Сила";
    case "mass":
      return "Масса";
    case "weight_loss":
      return "Похудение";
    default:
      return "База";
  }
}

function getMovementPatternLabel(value) {
  if (!value) {
    return "Без паттерна";
  }

  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (symbol) => symbol.toUpperCase());
}

function getTagLabel(value) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (symbol) => symbol.toUpperCase());
}

function normalizeSearchToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function ExerciseDetailBlock({ title, items }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}_${item}`}
            className="rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, exerciseNameMap }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const difficultyMeta = getDifficultyMeta(exercise.difficulty);
  const allMuscles = Array.isArray(exercise.muscleGroups)
    ? exercise.muscleGroups.map(getTagLabel)
    : [];
  const goalTags = Array.isArray(exercise.goalTags)
    ? exercise.goalTags.map(getTagLabel)
    : [];
  const contraindications = Array.isArray(exercise.contraindications)
    ? exercise.contraindications.map(getTagLabel)
    : [];
  const alternatives = Array.isArray(exercise.alternatives)
    ? exercise.alternatives.map(
        (alternativeId) =>
          exerciseNameMap[alternativeId] ?? getTagLabel(alternativeId),
      )
    : [];

  return (
    <article className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-subtle)]">
            {getBodyPartLabel(exercise.bodyPart)}
          </p>
          <h2 className="mt-1 text-[18px] font-semibold leading-6 text-[var(--text-primary)]">
            {exercise.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {getEquipmentLabel(exercise.equipment)} • {getTypeLabel(exercise.type)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${difficultyMeta.badgeClassName}`}
        >
          {difficultyMeta.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Формат
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {exercise.compound ? "Базовое" : "Изоляция"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Паттерн
          </p>
          <p className="mt-1 truncate text-sm font-medium text-[var(--text-primary)]">
            {getMovementPatternLabel(exercise.movementPattern)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        className="mt-3 w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition active:scale-[0.99]"
      >
        {isExpanded ? "Скрыть детали" : "Открыть детали"}
      </button>

      {isExpanded ? (
        <div className="mt-4 flex flex-col gap-3">
          <ExerciseDetailBlock title="Все мышцы" items={allMuscles} />
          <ExerciseDetailBlock title="Цели" items={goalTags} />
          <ExerciseDetailBlock
            title="Противопоказания"
            items={contraindications}
          />
          <ExerciseDetailBlock title="Альтернативы" items={alternatives} />

          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Id упражнения
            </p>
            <p className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]">
              {exercise.id}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function LibraryPage() {
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const exerciseNameMap = useMemo(
    () => Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.name])),
    [exercises],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadExercises() {
      try {
        const response = await fetch(`${DATABASE_CONFIG.apiBaseUrl}/exercises`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message ?? "Не удалось загрузить библиотеку.");
        }

        if (!isMounted) {
          return;
        }

        setExercises(Array.isArray(payload.exercises) ? payload.exercises : []);
        setError("");
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setExercises([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Не удалось загрузить библиотеку.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExercises();

    return () => {
      isMounted = false;
    };
  }, []);

  const bodyPartOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(exercises.map((item) => item.bodyPart).filter(Boolean)),
    );
    const ordered = [
      ...BODY_PART_ORDER.filter((key) => fromData.includes(key)),
      ...fromData.filter((key) => !BODY_PART_ORDER.includes(key)),
    ];

    return ordered.map((key) => ({
      key,
      label: getBodyPartLabel(key),
    }));
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const query = normalizeSearchToken(searchQuery);

    return exercises.filter((exercise) => {
      if (
        selectedBodyPart !== "all" &&
        String(exercise.bodyPart ?? "") !== selectedBodyPart
      ) {
        return false;
      }

      if (
        selectedDifficulty !== "all" &&
        String(exercise.difficulty ?? "") !== selectedDifficulty
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = normalizeSearchToken(
        [
          exercise.name,
          exercise.id,
          getBodyPartLabel(exercise.bodyPart),
          getEquipmentLabel(exercise.equipment),
          getTypeLabel(exercise.type),
          getMovementPatternLabel(exercise.movementPattern),
          ...(Array.isArray(exercise.goalTags) ? exercise.goalTags : []),
          ...(Array.isArray(exercise.muscleGroups) ? exercise.muscleGroups : []),
        ].join(" "),
      );

      return haystack.includes(query);
    });
  }, [exercises, searchQuery, selectedBodyPart, selectedDifficulty]);

  const groupedExercises = useMemo(() => {
    const groupsMap = new Map();

    filteredExercises.forEach((exercise) => {
      const groupKey = exercise.bodyPart ?? "other";
      const currentGroup = groupsMap.get(groupKey) ?? [];
      currentGroup.push(exercise);
      groupsMap.set(groupKey, currentGroup);
    });

    return [
      ...BODY_PART_ORDER.filter((key) => groupsMap.has(key)).map((key) => ({
        key,
        label: getBodyPartLabel(key),
        items: groupsMap.get(key) ?? [],
      })),
      ...Array.from(groupsMap.keys())
        .filter((key) => !BODY_PART_ORDER.includes(key))
        .map((key) => ({
          key,
          label: getBodyPartLabel(key),
          items: groupsMap.get(key) ?? [],
        })),
    ];
  }, [filteredExercises]);

  const uniqueBodyPartsCount = bodyPartOptions.length;
  const uniqueEquipmentCount = useMemo(
    () => new Set(exercises.map((item) => getEquipmentLabel(item.equipment))).size,
    [exercises],
  );

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[30px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
        <PageBackButton />

        <header className="rounded-[24px] border border-[var(--border-primary)] bg-[linear-gradient(145deg,var(--surface-secondary),var(--surface-primary))] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Библиотека
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-9 text-[var(--text-primary)]">
            Каталог упражнений
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Полноценный рабочий отдел упражнений: быстрый доступ к карточкам,
            фильтрация и структурированный просмотр по зонам.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Упражнений
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              {exercises.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Зон
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              {uniqueBodyPartsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Инвентарь
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
              {uniqueEquipmentCount}
            </p>
          </div>
        </div>

        <section className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск по названию, мышцам, типу..."
              className="w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBodyPart}
                onChange={(event) => setSelectedBodyPart(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="all">Все зоны</option>
                {bodyPartOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(event) => setSelectedDifficulty(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
              >
                <option value="all">Любая сложность</option>
                <option value="1">Легкое</option>
                <option value="2">Среднее</option>
                <option value="3">Сложное</option>
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <LoadingCard
            title="Загружаем библиотеку упражнений"
            description="Подтягиваем каталог, группы мышц и детальные карточки."
            centered
          />
        ) : null}

        {error ? (
          <div className="rounded-[24px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-5 py-4 text-sm leading-6 text-[var(--danger-text)]">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="flex flex-col gap-5">
            {filteredExercises.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-6 text-sm text-[var(--text-muted)]">
                По текущим фильтрам ничего не найдено. Попробуй очистить поиск
                или выбрать другую зону.
              </div>
            ) : (
              groupedExercises.map((group) => (
                <section key={group.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {group.label}
                    </h2>
                    <span className="rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {group.items.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        exerciseNameMap={exerciseNameMap}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

