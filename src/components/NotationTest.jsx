import { Link } from "react-router-dom";

export default function NotationTest() {
  return (
    <section className="m-5 p-5 bg-linear-to-r from-blue-300 to-blue-500 text-white">
      <h1 className="text-2xl ">Ваша персональная тренировка уже готова</h1>
      <p className="font-extralight my-3">
        Пройдите тест, и узнайте, как достичь поставленой цели!
      </p>
      <button className="relative left-50 right-0 bg-white text-xl text-neutral-500 px-5 py-3 rounded-xl">
       <Link to="/Test">Пройти тест</Link> 
      </button>
    </section>
  );
}
