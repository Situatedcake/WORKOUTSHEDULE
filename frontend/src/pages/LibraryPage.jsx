import PageShell from "../components/PageShell";

const librarySections = [
  {
    title: "База упражнений",
    description: "Здесь позже появятся карточки упражнений с техникой, видео и подсказками по замене.",
  },
  {
    title: "Готовые подборки",
    description: "Для начинающих, на массу, на выносливость и под домашние условия.",
  },
  {
    title: "Фильтры по мышцам",
    description: "Можно будет быстро выбрать упражнения на грудь, спину, ноги, плечи и руки.",
  },
];

export default function LibraryPage() {
  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
            Библиотека
          </p>
          <h1 className="text-3xl font-medium text-white">Каталог упражнений</h1>
          <p className="text-base leading-6 text-[#8E97A8]">
            Пока это легкая заглушка под будущую базу упражнений, фильтры и обучающие материалы.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {librarySections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-4"
            >
              <h2 className="text-lg font-medium text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#8E97A8]">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
