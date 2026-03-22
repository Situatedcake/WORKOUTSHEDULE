import PageShell from "./PageShell";

export default function PlaceholderPage({ title, description }) {
  return (
    <PageShell className="pt-10">
      <section className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
          Раздел
        </p>
        <h1 className="text-3xl font-medium text-white">{title}</h1>
        <p className="text-base leading-6 text-[#8E97A8]">{description}</p>
      </section>
    </PageShell>
  );
}
