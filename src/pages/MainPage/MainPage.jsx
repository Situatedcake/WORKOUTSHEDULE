import { Link } from "react-router";
import "./MainPage.css";
import MenuBTN from "/menu.svg";
import NavMenu from "./NavMenu";

import Triangle from "/icons/triangle.svg";

export default function mainPage() {
  return (
    <>
      <header className="flex flex-wrap justify-evenly">
        <button>
          <img src={MenuBTN} />
        </button>
        <span className="text-2xl">Привет, Данил!</span>
        <div className="p-5 rounded-3xl bg-white" id="userCard"></div>
      </header>

      <section id="TraningCart" className="">
        <h1
          className="
            text-3xl
            font-medium
            max-w-5
            leading-10
        "
        >
          Тренеровка сегодня
        </h1>
        <h3
          className="
          text-2xl
          font-light
        "
        >
          19:00
        </h3>
        <Link
          to="/StartTraningPage"
          className="
            
            bg-[#3CFFB9]
            text-black
            text-2xl
            font-medium
            rounded-4xl
            py-4
            px-10
            mt-8
            flex
            nowrap
            items-center
          "
        >
          <img src={Triangle} className="mx-4" />
          Приступить
        </Link>
      </section>

      <section className="">
        <button>Библиотека упражнений</button>
        <button>Составить тренеровку</button>
        <button>Пройти тест</button>
      </section>

      <NavMenu />
    </>
  );
}
