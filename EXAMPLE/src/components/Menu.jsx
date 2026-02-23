// components/Menu.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { User, BookOpen, PlusCircle } from "lucide-react";

export default function Menu() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "text-blue-600" : "text-gray-600";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 max-w-md mx-auto">
      <div className="flex justify-around items-center">
        <button className="flex flex-col items-center">
          <User className={`w-6 h-6 ${isActive("/profile")}`} />
          <span className="text-xs mt-1 text-gray-600">Профиль</span>
        </button>

        <Link to="/exercises" className="flex flex-col items-center">
          <BookOpen className={`w-6 h-6 ${isActive("/exercises")}`} />
          <span className="text-xs mt-1 text-gray-600">Библиотека</span>
        </Link>

        <Link to="/create-training" className="flex flex-col items-center">
          <PlusCircle className={`w-6 h-6 ${isActive("/create-training")}`} />
          <span className="text-xs mt-1 text-gray-600">Составить</span>
        </Link>
      </div>
    </nav>
  );
}
