import Fire from "./images/fire.svg";
import { User, BookOpenIcon, Settings } from "lucide-react";

export default function App() {
  return (
    <>
      <nav className="fixed bottom-0 right-0 left-0 py-4 px-12 bg-blue-400 ">
        <div className="flex justify-between items-center">
          <button>
            <User color="white" size={40} />
          </button>
          <button>
            <BookOpenIcon color="white" size={40} />
          </button>
          <button>
            <Settings color="white" size={40} />
          </button>
        </div>
      </nav>

      <div className="bg-neutral-600 text-white p-4 my-6 mx-5 flex justify-between">
        <div>
          <span>Ближайшая тренеровка:</span>
          <h1 className="text-4xl">Сегодня</h1>
          <p className="max-w-40 text-xl">Грудь, Трицепс, пресс</p>

          <button className="px-6 py-1 m-3 bg-amber-600 rounded-md text-3xl">
            Начать{" "}
          </button>
        </div>
        <img src={Fire} alt="" className="w-30" />
      </div>

      <section>
        <div className="h-38 bg-gray-500 mx-4 rounded-2xl"></div>
        <div className="flex mt-5">
          <div className="h-38 w-1/2 bg-indigo-400 mx-4 rounded-2xl p-5 text-white text-xl">
            <h1>Библиотека упражнений </h1>
            <p className="text-[16px] pt-2">150+ упражнений для дома и зала</p>
          </div>
          <div className="h-38 w-1/2 bg-pink-700 mx-4 rounded-2xl p-4">
            <span className="text-white text-xl ">
              Составить программу тренировок
            </span>
          </div>
        </div>
      </section>

      <section className="m-5 p-5 bg-linear-to-r from-blue-300 to-blue-500 text-white">
        <h1 className="text-2xl ">Ваша персональная тренировка уже готова</h1>
        <p className="font-extralight my-3">
          Пройдите тест, и узнайте, как достичь поставленой цели!
        </p>
        <button className="relative left-50 right-0 bg-white text-xl text-neutral-500 px-5 py-3 rounded-xl">
          Пройти тест
        </button>
      </section>
    </>
  );
}
