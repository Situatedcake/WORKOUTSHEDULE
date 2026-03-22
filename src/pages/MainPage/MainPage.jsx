import { Link } from "react-router";
import "./MainPage.css";
import MenuButton from "/menu.svg";
import libraryIcon from "/icons/library.svg";
import questionIcon from "/icons/quastion.svg";
import trainingIcon from "/icons/addTraning.svg";
import triangleIcon from "/icons/triangle.svg";
import arrowIcon from "/icons/arrowRight.svg";
import NavMenu from "../../components/NavMenu";
import { ROUTES } from "../../constants/routes";

const mainActions = [
  {
    text: "Библиотека упражнений",
    img: libraryIcon,
    alt: "Библиотека упражнений",
    url: ROUTES.LIBRARY,
  },
  {
    text: "Составить тренировку",
    img: trainingIcon,
    alt: "Составить тренировку",
    url: ROUTES.CREATE_TRAINING,
  },
  {
    text: "Пройти тест",
    img: questionIcon,
    alt: "Пройти тест",
    url: ROUTES.START_TASTING,
  },
];

export default function MainPage() {
  return (
    <>
      <header className="flex flex-wrap justify-evenly">
        <button type="button" aria-label="Меню">
          <img src={MenuButton} alt="" aria-hidden="true" />
        </button>
        <span className="text-2xl">Привет, Данил!</span>
        <div className="p-5 rounded-3xl bg-white" id="userCard"></div>
      </header>

      <section id="TraningCart">
        <h1 className="max-w-5 text-3xl font-medium leading-10">
          Тренировка сегодня
        </h1>
        <h3 className="text-2xl font-light">19:00</h3>

        <Link
          to={ROUTES.START_TRAINING}
          className="mt-8 flex items-center rounded-4xl bg-[#3CFFB9] px-10 py-4 text-2xl font-medium text-black active:bg-[#3CFFB9]/80"
        >
          <img src={triangleIcon} alt="" aria-hidden="true" className="mx-4" />
          Приступить
        </Link>
      </section>

      <section className="flex flex-wrap px-5">
        {mainActions.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className="mt-3 flex w-full items-center gap-5 rounded-3xl border border-[#383838] bg-[#12151C] p-4 text-xl font-light"
          >
            <img src={item.img} alt={item.alt} />
            {item.text}
            <img src={arrowIcon} alt="" aria-hidden="true" className="ml-auto" />
          </Link>
        ))}
      </section>

      <NavMenu />
    </>
  );
}
