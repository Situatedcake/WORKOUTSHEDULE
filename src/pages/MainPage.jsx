import Fire from "../images/fire.svg"
import NotationTest from "../components/NotationTest"

export default function MainPage() {
  return (
    <>
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
        <div className="h-38 bg-gray-500 mx-4 rounded-2xl">
          <p className="text-white p-10">здесь потом будет че то крутое</p>
        </div>
        <div className="flex mt-5">
          <div className="h-38 w-1/2 bg-indigo-400 mx-4 rounded-2xl p-5 text-white text-xl">
            <h1>Библиотека упражнений </h1>
            <p className="text-[16px] pt-2">150+ упражнений для дома и зала</p>
          </div>
          <div className="h-38 w-1/2 bg-red-500 mx-4 rounded-2xl p-4">
            <span className="text-white text-xl ">
              Составить программу тренировок
            </span>
          </div>
        </div>
      </section>

      <NotationTest/>
    </>
  );
}
