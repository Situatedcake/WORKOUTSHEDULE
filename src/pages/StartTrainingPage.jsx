// pages/StartTrainingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Award, ChevronRight, Dumbbell, Zap } from 'lucide-react';

const StartTrainingPage = () => {
  // Моковые данные тренировки
  const trainingPlan = {
    name: 'Силовая тренировка',
    totalTime: '45 мин',
    exercises: [
      { 
        id: 1, 
        name: 'Приседания с штангой', 
        sets: 4, 
        reps: 12,
        difficulty: 'Средний',
        level: 2
      },
      { 
        id: 2, 
        name: 'Жим лежа', 
        sets: 4, 
        reps: 10,
        difficulty: 'Сложный',
        level: 3
      },
      { 
        id: 3, 
        name: 'Тяга верхнего блока', 
        sets: 3, 
        reps: 15,
        difficulty: 'Легкий',
        level: 1
      },
      { 
        id: 4, 
        name: 'Выпады с гантелями', 
        sets: 3, 
        reps: 12,
        difficulty: 'Средний',
        level: 2
      },
    ]
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Легкий': return 'text-green-600 bg-green-50';
      case 'Средний': return 'text-yellow-600 bg-yellow-50';
      case 'Сложный': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level) => {
    return level === 1 ? '🌱' : level === 2 ? '💪' : '⚡';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">План тренировки</h1>
        <p className="text-gray-600 mt-1">{trainingPlan.name}</p>
      </div>

      {/* Метрики тренировки */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Общее время</p>
              <p className="text-xl font-bold text-gray-900">{trainingPlan.totalTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Упражнений</p>
              <p className="text-xl font-bold text-gray-900">{trainingPlan.exercises.length}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">🌱 Начинающий</span>
          <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded-full">💪 Средний</span>
          <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">⚡ Продвинутый</span>
        </div>
      </div>

      {/* Список упражнений */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 px-1">Упражнения</h2>
        
        {trainingPlan.exercises.map((exercise, index) => (
          <div 
            key={exercise.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-medium text-gray-900">
                    {index + 1}. {exercise.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span>{exercise.sets} × {exercise.reps}</span>
                  <span>•</span>
                  <span>{exercise.sets * exercise.reps} повторений</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                    {getLevelIcon(exercise.level)} {exercise.difficulty}
                  </span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка начала тренировки */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto">
        <Link
          to="/training"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          Начать тренировку
        </Link>
      </div>
    </div>
  );
};

export default StartTrainingPage;