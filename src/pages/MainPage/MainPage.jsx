import { Link } from "react-router";
import "./MainPage.css";
import MenuBTN from "/menu.svg";
import NavMenu from "../../components/NavMenu";

import library from "/icons/library.svg";
import quastion from "/icons/quastion.svg";
import addtraning from "/icons/addTraning.svg";

import Triangle from "/icons/triangle.svg";
import arrow from "/icons/arrowRight.svg";

const buttonText = [
  { text: "Библиотека упражнений", img: library, url: "/library" },
  { text: "Составить тренеровку", img: addtraning, url: "/create-training" },
  { text: "Пройти тест", img: quastion, url: "/start-tasting" },
];

const MainButton = ({ text, img, url }) => {
  return (
    <Link
      to={url}
      className="
    bg-[#12151C]
    border border-[#383838]
    p-4
    rounded-3xl
    text-xl
    font-light
    mt-3
    w-full
    flex
    items-center
    gap-5

  "
    >
      <img src={img} alt="" />
      {text}
      <img src={arrow} className="ml-auto" />
    </Link>
  );
};

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
          to="/Start-traning"
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

      <section className="flex flex-wrap px-5">
        {buttonText.map((item) => (
          <MainButton text={item.text} img={item.img} url={item.url} />
        ))}
      </section>

      <NavMenu />
    </>
  );
}
