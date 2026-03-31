import { LoadingBars, LoadingOrb } from "./LoadingCard";
import "./LoadingState.css";

export default function AppLoadingScreen({
  label = "Запускаем приложение",
  hint = "Подготавливаем профиль, маршруты и персональные данные.",
}) {
  return (
    <main className="app-loading-screen" role="status" aria-live="polite">
      <section className="app-loading-screen__card">
        <div className="app-loading-screen__layout">
          <div className="app-loading-screen__badge">
            <span>WorkoutSchedule</span>
          </div>
          <div className="mt-6">
            <LoadingOrb />
          </div>
          <h1 className="app-loading-screen__title">{label}</h1>
          <p className="app-loading-screen__text">{hint}</p>
          <div className="app-loading-screen__bars">
            <LoadingBars />
          </div>
        </div>
      </section>
    </main>
  );
}
