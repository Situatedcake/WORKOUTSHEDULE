import NavMenu from "../components/NavMenu";
import TestImg from "/images/testingPageIMG.png";

export default function StartTastingPage() {
  return (
    <>
      <section className="flex flex-wrap px-5">
        <img src={TestImg} alt="" />
        <h1 className="text-xl">Тест на определение уровня подготовки</h1>
      </section>
      <button>Начать тест</button>
      <NavMenu />
    </>
  );
}
