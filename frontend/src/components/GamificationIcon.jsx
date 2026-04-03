function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BlueprintIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 5.5H18V18.5H6V5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9H15M9 12H15M9 15H13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.5V7M17 4.5V7M5.5 8.5H18.5M6.5 6H17.5C18.6046 6 19.5 6.89543 19.5 8V17.5C19.5 18.6046 18.6046 19.5 17.5 19.5H6.5C5.39543 19.5 4.5 18.6046 4.5 17.5V8C4.5 6.89543 5.39543 6 6.5 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 20V5.5M7 6C9 3.5 12 8.5 16 6.5V14C12 16 9 11 7 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.5 3.5C14.2 6.2 18 8.2 18 13C18 17.1 15.1 20 11.5 20C7.9 20 5 17.1 5 13.5C5 10.4 6.7 8.4 8.3 6.8C9 9.3 10.2 10.7 11.7 11.6C12.4 10.1 12.9 8.2 12.8 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.5H16V7.5C16 9.70914 14.2091 11.5 12 11.5C9.79086 11.5 8 9.70914 8 7.5V4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 19.5H15M12 11.5V19.5M16 6.5H18C18.8284 6.5 19.5 7.17157 19.5 8V8.5C19.5 10.7091 17.7091 12.5 15.5 12.5H15M8 6.5H6C5.17157 6.5 4.5 7.17157 4.5 8V8.5C4.5 10.7091 6.29086 12.5 8.5 12.5H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10V14M6.5 8.5V15.5M9 9.5V14.5M15 9.5V14.5M17.5 8.5V15.5M20 10V14M9 12H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 5.5C8.11929 5.5 7 6.61929 7 8C5.61929 8 4.5 9.11929 4.5 10.5C4.5 11.714 5.36518 12.726 6.51202 12.953M14.5 5.5C15.8807 5.5 17 6.61929 17 8C18.3807 8 19.5 9.11929 19.5 10.5C19.5 11.714 18.6348 12.726 17.488 12.953M9.5 5.5C9.5 4.11929 10.6193 3 12 3C13.3807 3 14.5 4.11929 14.5 5.5M9.5 5.5V18M14.5 5.5V18M8 18H16M7 18C7 19.1046 7.89543 20 9 20H15C16.1046 20 17 19.1046 17 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 17L6.8 7.5L12 12L17.2 7.5L19 17H5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 20H16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function renderGamificationIcon(iconKey) {
  switch (iconKey) {
    case "blueprint":
      return <BlueprintIcon />;
    case "calendar":
      return <CalendarIcon />;
    case "flag":
      return <FlagIcon />;
    case "flame":
      return <FlameIcon />;
    case "trophy":
      return <TrophyIcon />;
    case "dumbbell":
      return <DumbbellIcon />;
    case "brain":
      return <BrainIcon />;
    case "crown":
      return <CrownIcon />;
    case "spark":
    default:
      return <SparkIcon />;
  }
}

export default function GamificationIcon({ iconKey = "spark", className = "" }) {
  return <div className={className}>{renderGamificationIcon(iconKey)}</div>;
}
