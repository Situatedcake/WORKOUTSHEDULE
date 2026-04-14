import { useEffect, useState } from "react";
import LoadingCard from "../components/LoadingCard";
import PageBackButton from "../components/PageBackButton";
import PageShell from "../components/PageShell";
import { DATABASE_CONFIG } from "../services/database/databaseConfig";

function getDifficultyMeta(level) {
  switch (Number(level)) {
    case 1:
      return {
        label: "Легкое",
        className: "bg-[#143423] text-[#8CF0B8]",
      };
    case 2:
      return {
        label: "Среднее",
        className: "bg-[#3A2C10] text-[#F6D27D]",
      };
    case 3:
      return {
        label: "Сложное",
        className: "bg-[#3A1418] text-[#FFB2B9]",
      };
    default:
      return {
        label: "Без уровня",
        className: "bg-[#1A1F2A] text-[#B9C1CF]",
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

function ExerciseDetailBlock({ title, items }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}_${item}`}
            className="rounded-full bg-[#161B24] px-2.5 py-1 text-xs text-[#B9C1CF]"
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
        (alternativeId) => exerciseNameMap[alternativeId] ?? getTagLabel(alternativeId),
      )
    : [];

  return (
    <article className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            {getBodyPartLabel(exercise.bodyPart)}
          </p>
          <h2 className="mt-1 text-[17px] font-medium leading-5 text-[var(--text-primary)]">
            {exercise.name}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">
            {getEquipmentLabel(exercise.equipment)} · {getTypeLabel(exercise.type)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${difficultyMeta.className}`}
        >
          {difficultyMeta.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--surface-primary)] px-2.5 py-1 text-[11px] text-[#B9C1CF]">
          {getEquipmentLabel(exercise.equipment)}
        </span>
        <span className="rounded-full bg-[var(--surface-primary)] px-2.5 py-1 text-[11px] text-[#B9C1CF]">
          {getTypeLabel(exercise.type)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        className="mt-3 w-full rounded-2xl bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-primary)] transition active:scale-[0.99]"
      >
        {isExpanded ? "Скрыть" : "Детали"}
      </button>

      {isExpanded ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Формат
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {exercise.compound ? "Базовое" : "Изоляция"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Паттерн
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {getMovementPatternLabel(exercise.movementPattern)}
              </p>
            </div>
          </div>

          <ExerciseDetailBlock title="Все мышцы" items={allMuscles} />
          <ExerciseDetailBlock title="Цели" items={goalTags} />
          <ExerciseDetailBlock
            title="Противопоказания"
            items={contraindications}
          />
          <ExerciseDetailBlock title="Альтернативы" items={alternatives} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Сторона
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {exercise.unilateral ? "Одностороннее" : "Двустороннее"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Id
              </p>
              <p className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]">
                {exercise.id}
              </p>
            </div>
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
  const exerciseNameMap = Object.fromEntries(
    exercises.map((exercise) => [exercise.id, exercise.name]),
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

  const uniqueBodyParts = new Set(exercises.map((item) => item.bodyPart).filter(Boolean))
    .size;
  const uniqueEquipment = new Set(
    exercises.map((item) => getEquipmentLabel(item.equipment)),
  ).size;

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
        <PageBackButton />

        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Библиотека
          </p>
          <h1 className="text-3xl font-medium text-[var(--text-primary)]">
            Каталог упражнений
          </h1>
          <p className="text-base leading-6 text-[var(--text-muted)]">
            Пока показываем всю базу сплошным списком. Следующим этапом сюда
            можно будет добавить поиск, группы мышц и фильтры.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 rounded-2xl bg-[var(--surface-secondary)] px-4 py-4 text-center sm:col-span-1">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Упражнений
            </p>
            <p className="mt-2 text-2xl font-medium text-[var(--text-primary)]">
              {exercises.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Зон
            </p>
            <p className="mt-2 text-2xl font-medium text-[var(--text-primary)]">
              {uniqueBodyParts}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              Инвентарь
            </p>
            <p className="mt-2 text-2xl font-medium text-[var(--text-primary)]">
              {uniqueEquipment}
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingCard
            title="Загружаем библиотеку упражнений"
            description="Подтягиваем каталог, группы мышц и карточки упражнений."
            centered
          />
        ) : null}

        {error ? (
          <div className="rounded-[24px] border border-[#5E4B1D] bg-[#2E2510] px-5 py-4 text-sm leading-6 text-[#F3D9A1]">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="flex flex-col gap-4">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                exerciseNameMap={exerciseNameMap}
              />
            ))}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
