import PageShell from "./PageShell";
import LoadingCard from "./LoadingCard";

export default function PageLoadingState({
  title = "Загружаем раздел...",
  description = "Подготавливаем данные и собираем экран.",
  showNavMenu = true,
}) {
  return (
    <PageShell
      className="flex min-h-[100dvh] items-center justify-center pt-5"
      showNavMenu={showNavMenu}
    >
      <section className="mx-auto w-full max-w-md">
        <LoadingCard
          title={title}
          description={description}
          centered
          compactOrb={false}
        />
      </section>
    </PageShell>
  );
}
