import PageShell from "./PageShell";

export default function PlaceholderPage({ title, description }) {
  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Раздел
        </p>
        <h1 className="text-3xl font-medium text-[var(--text-primary)]">{title}</h1>
        <p className="text-base leading-6 text-[var(--text-muted)]">{description}</p>
      </section>
    </PageShell>
  );
}
