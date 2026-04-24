# ML Adaptation (Rule-Based)

## Current State

В проекте используется не нейросеть, а расширяемая rule-based система, подготовленная под будущую ML-инференс архитектуру.

Ключевые модули:

- `backend/services/trainingFeatureBuilder.js`
- `backend/services/workoutGenerator.js`
- `backend/services/smartTrainingPlan.js`
- `backend/services/adaptiveSignals.js`
- `backend/services/adaptiveVolume.js`
- `backend/services/trainingMlFeedback.js`

## Input Signals

Система учитывает:

- профиль пользователя (уровень, цель, пол, частота);
- историю тренировок (`workoutHistory`);
- обратную связь и поведенческие события (`trainingMlFeedbackHistory`);
- восстановление (сон/энергия/усилие);
- пропуски (в том числе `exercise_skipped`).

## Output

Система возвращает:

- состав упражнений по сессиям;
- объём внутри упражнения (sets/reps/rest);
- причины адаптации (`volumeReason`, `adaptationHints`);
- candidate pool для ручных замен.

## Why This Is ML-Ready

- признаки уже вынесены в отдельный слой (`trainingFeatureBuilder`);
- события обратной связи нормализуются;
- модель генерации плана изолирована от API transport layer;
- можно заменить scoring/rules на inference модель с тем же интерфейсом.

## Recommended Next Step

1. Добавить batch-логирование обучающих примеров:
   - features snapshot
   - action (что изменили)
   - outcome (прошёл/пропустил/частично)
2. Ввести offline evaluation dataset.
3. Подключить shadow-model inference без влияния на production output.
