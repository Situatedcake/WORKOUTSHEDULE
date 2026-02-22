// pages/TrainingPage.jsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';

export default function TrainingPage() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);

  // Моковые данные тренировки
  const exercises = [
    { id: 1, name: 'Приседания с штангой', duration: '45 сек', reps: '12', completed: false },
    { id: 2, name: 'Жим лежа', duration: '45 сек', reps: '10', completed: false },
    { id: 3, name: 'Тяга верхнего блока', duration: '40 сек', reps: '15', completed: false },
    { id: 4, name: 'Выпады с гантелями', duration: '45 сек', reps: '12', completed: false },
  ];

  const currentEx = exercises[currentExercise];
  const nextEx = exercises[currentExercise + 1];

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setExerciseTime(prev => prev + 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCompletedExercises([...completedExercises, currentExercise]);
      setCurrentExercise(currentExercise + 1);
      setExerciseTime(0);
    } else {
      // Завершение тренировки
      alert('Тренировка завершена!');
    }
  };

  const handlePreviousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
      setExerciseTime(0);
    }
  };

  const progress = ((currentExercise + 1) / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Прогресс бар */}
      <div className="bg-white pt-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Упражнение {currentExercise + 1} из {exercises.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Основное упражнение */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          {/* Таймеры */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Упражнение</p>
              <p className="text-3xl font-bold text-gray-900">{formatTime(exerciseTime)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Всего</p>
              <p className="text-3xl font-bold text-blue-600">{formatTime(totalTime)}</p>
            </div>
          </div>

          {/* Текущее упражнение */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentEx.name}</h2>
            <div className="flex justify-center gap-4 text-gray-600">
              <span>{currentEx.reps} повторений</span>
              <span>•</span>
              <span>{currentEx.duration}</span>
            </div>
          </div>

          {/* Управление */}
          <div className="flex justify-center items-center gap-6 mb-6">
            <button 
              onClick={handlePreviousExercise}
              disabled={currentExercise === 0}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentExercise === 0 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button 
              onClick={() => setIsRunning(!isRunning)}
              className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>

            <button 
              onClick={handleNextExercise}
              className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Кнопка завершить упражнение */}
          <button 
            onClick={handleNextExercise}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Завершить упражнение
          </button>
        </div>
      </div>

      {/* Следующее упражнение */}
      {nextEx && (
        <div className="px-4 mt-4">
          <p className="text-sm text-gray-600 mb-2">Следующее:</p>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{nextEx.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{nextEx.reps} повторений</p>
              </div>
              <span className="text-sm text-gray-500">{nextEx.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* Завершенные упражнения */}
      {completedExercises.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-sm text-gray-600 mb-2">Выполнено:</p>
          <div className="space-y-2">
            {completedExercises.map((index) => (
              <div key={index} className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700 line-through">
                    {exercises[index].name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};