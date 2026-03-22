import { useNavigate } from "react-router";
import TestImg from "/images/testingPageIMG.png";
import NavMenu from "../../components/NavMenu";
import { ROUTES } from "../../constants/routes";
import { startTastingSession } from "../../utils/tastingSession";

const tastingFeatures = [
  "Тест займет около 10 минут",
  "После завершения вы получите персональную программу тренировок",
  "Тест состоит из 10 вопросов",
];

export default function StartTastingPage() {
  const navigate = useNavigate();

  const handleStartTest = () => {
    startTastingSession();
    navigate(ROUTES.TASTING);
  };

  return (
    <>
      <section className="flex flex-wrap px-5">
        <img src={TestImg} alt="Иллюстрация теста" />
        <h1 className="text-2xl">Тест на определение уровня подготовки</h1>
        <p className="text-neutral-500 text-l">
          Определите свой уровень и мы составим программу тренировок только для
          вас
        </p>
        <ol className="flex flex-wrap gap-2 ">
          {tastingFeatures.map((feature) => (
            <li key={feature} className="pl-3 text-neutral-500">
              {feature}
            </li>
          ))}
        </ol>
      </section>
      <button
        type="button"
        onClick={handleStartTest}
        className="
        absolute
        bottom-70
        text-white
        rounded-4xl
        px-24
        py-4
        mx-10
        bg-[#01BB96]
        text-xl
      "
      >
        Начать тест
      </button>
      <NavMenu />
    </>
  );
}
