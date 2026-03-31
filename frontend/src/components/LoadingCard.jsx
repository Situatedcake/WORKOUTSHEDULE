import "./LoadingState.css";

export function LoadingBars() {
  return (
    <div className="loading-bars" aria-hidden="true">
      <span className="loading-bars__item" style={{ "--loading-delay": "0s" }} />
      <span
        className="loading-bars__item"
        style={{ "--loading-delay": "0.12s" }}
      />
      <span
        className="loading-bars__item"
        style={{ "--loading-delay": "0.24s" }}
      />
    </div>
  );
}

export function LoadingOrb({ compact = false }) {
  return (
    <div
      className={`loading-orb ${compact ? "loading-orb--compact" : ""}`}
      aria-hidden="true"
    >
      <span className="loading-orb__ring" />
      <span className="loading-orb__pulse" />
      <span className="loading-orb__core" />
    </div>
  );
}

export default function LoadingCard({
  title = "Загружаем данные...",
  description = "Это займет всего пару секунд.",
  centered = false,
  showSkeleton = true,
  compactOrb = true,
  className = "",
}) {
  return (
    <div
      className={`loading-card ${centered ? "loading-card--centered" : ""} ${className}`}
      role="status"
      aria-live="polite"
    >
      <LoadingOrb compact={compactOrb} />
      <div className={centered ? "max-w-xs" : ""}>
        <p className="loading-card__title">{title}</p>
        <p className="loading-card__text">{description}</p>
      </div>
      <LoadingBars />
      {showSkeleton ? (
        <div className="loading-card__skeleton" aria-hidden="true">
          <span className="loading-card__line" />
          <span className="loading-card__line" />
          <span className="loading-card__line" />
        </div>
      ) : null}
    </div>
  );
}
