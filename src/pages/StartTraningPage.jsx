import { Link } from "react-router";
import clockIcon from "/icons/clock.svg";
import menuIcon from "/menu.svg";
import backIcon from "/icons/arrowBack.svg";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";

export default function StartTraningPage() {
  return (
    <PageShell className="pt-4">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-4">
        <Link to={ROUTES.HOME} className="rounded-2xl p-2" aria-label="Назад">
          <img src={backIcon} alt="" aria-hidden="true" />
        </Link>

        <h1 className="text-2xl font-medium">План тренировки</h1>

        <button type="button" className="rounded-2xl p-2" aria-label="Меню">
          <img src={menuIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className="mx-auto mt-8 flex w-full max-w-md flex-col gap-6 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-[#0B0E15] p-3">
            <img src={clockIcon} alt="" aria-hidden="true" />
          </div>

          <div>
            <span className="block text-2xl font-medium">85 минут</span>
            <p className="text-sm text-[#8E97A8]">Примерное время тренировки</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0B0E15] px-4 py-3 text-sm text-[#8E97A8]">
          Сложность и список упражнений можно добавить здесь, когда страница
          тренировки будет готова полностью.
        </div>

        <div className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-8 text-center text-[#8E97A8]">
          Блок с упражнениями в разработке
        </div>
      </section>
    </PageShell>
  );
}
