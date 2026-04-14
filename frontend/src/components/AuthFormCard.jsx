import { useState } from "react";
import { Link } from "react-router";
import PageShell from "./PageShell";
import PageBackButton from "./PageBackButton";
import PasswordField from "./PasswordField";

export default function AuthFormCard({
  title,
  subtitle,
  submitText,
  onSubmit,
  footerText,
  footerLinkText,
  footerTo,
  requirePasswordConfirmation = false,
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (requirePasswordConfirmation && password !== passwordConfirmation) {
      setErrorMessage("Пароли не совпадают.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        login,
        password,
        passwordConfirmation,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Что-то пошло не так.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
        <PageBackButton />

        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-medium text-[var(--text-primary)]">{title}</h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-[var(--text-muted)]">Логин</span>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              placeholder="Введите логин"
              autoComplete="username"
            />
          </label>

          <PasswordField
            label="Пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            autoComplete={
              requirePasswordConfirmation ? "new-password" : "current-password"
            }
          />

          {requirePasswordConfirmation ? (
            <PasswordField
              label="Подтвердите пароль"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="Повторите пароль"
              autoComplete="new-password"
            />
          ) : null}

          {errorMessage ? (
            <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-text)]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-3xl bg-[var(--accent-primary)] px-5 py-4 text-base font-medium text-[var(--accent-contrast)] shadow-[0_12px_28px_rgba(1,187,150,0.2)] disabled:opacity-60"
          >
            {isSubmitting ? "Подождите..." : submitText}
          </button>
        </form>

        <p className="text-sm leading-6 text-[var(--text-muted)]">
          {footerText}{" "}
          <Link to={footerTo} className="text-[var(--accent-primary)]">
            {footerLinkText}
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
