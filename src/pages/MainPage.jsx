// pages/MainPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const MainPage = () => {
  // Моковые данные для демонстрации
  const nextTraining = {
    date: 'Сегодня',
    time: '18:00',
    exercises: 8,
    duration: '45 мин'
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Мои тренировки</h1>
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-semibold">👤</span>
        </div>
      </div>

      {/* Ближайшая тренировка */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 text-blue-600 mb-3">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Ближайшая тренировка</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">{nextTraining.date}</p>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {nextTraining.time}
              </span>
              <span>{nextTraining.exercises} упражнений</span>
              <span>{nextTraining.duration}</span>
            </div>
          </div>
          
          <Link 
            to="/start-training" 
            className="bg-blue-600 text-xs text-white px-4 py-2 rounded-xl font-medium flex items-center gap-1 hover:bg-blue-700 transition-colors"
          >
            Приступить
            {/* <ArrowRight className="w-5 h-5" /> */}
          </Link>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-4">
        <Link 
          to="/exercises" 
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-green-600 text-xl">📚</span>
          </div>
          <h3 className="font-semibold text-gray-900">Библиотека</h3>
          <p className="text-sm text-gray-600 mt-1">150+ упражнений</p>
        </Link>

        <Link 
          to="/create-training" 
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-purple-600 text-xl">✨</span>
          </div>
          <h3 className="font-semibold text-gray-900">Составить</h3>
          <p className="text-sm text-gray-600 mt-1">Под ваши цели</p>
        </Link>
      </div>

      <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Персональная подборка</h3>
        <p className="text-blue-100 text-sm mb-4">
          Тренировка под ваш уровень и предпочтения уже готова
        </p>
        <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors">
          Посмотреть рекомендацию
        </button>
      </div>
    </div>
  );
};

export default MainPage;