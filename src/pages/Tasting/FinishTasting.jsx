import { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router";
import PageShell from "../../components/PageShell";
import { ROUTES } from "../../constants/routes";
import { clearTastingStart, getTastingScore } from "../../utils/tastingSession";

export default function FinishTasting() {
  const location = useLocation();
  const totalScore = location.state?.totalScore ?? getTastingScore();

  useEffect(() => {
    if (totalScore !== null) {
      clearTastingStart();
    }
  }, [totalScore]);

  if (totalScore === null) {
    return <Navigate to={ROUTES.START_TASTING} replace />;
  }

  return (
    <PageShell className="pt-10">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8E97A8]">
          Тест завершен
        </p>

        <h1 className="text-3xl font-medium leading-tight text-white">
          Ваш результат
        </h1>

        <div className="rounded-[28px] border border-[#2A3140] bg-[#12151C] px-6 py-8">
          <p className="text-sm text-[#8E97A8]">
            Суммарное количество баллов
          </p>
          <p className="mt-3 text-5xl font-medium text-[#01BB96]">
            {totalScore}
          </p>
        </div>

        <Link
          to={ROUTES.START_TASTING}
          className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
        >
          Пройти тест заново
        </Link>
      </section>
    </PageShell>
  );
}
