import { useNavigate } from "react-router";
import { ROUTES } from "../constants/routes";

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11.75 5L6.75 10L11.75 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PageBackButton({
  fallbackTo = ROUTES.HOME,
  label = "\u041d\u0430\u0437\u0430\u0434",
  className = "",
}) {
  const navigate = useNavigate();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex h-11 w-11 items-center justify-center self-start rounded-2xl border border-[#2A3140] text-white ${className}`.trim()}
      aria-label={label}
    >
      <BackIcon />
    </button>
  );
}
