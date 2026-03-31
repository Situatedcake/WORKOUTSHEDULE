import { useState } from "react";

function EyeIcon({ isVisible }) {
  if (isVisible) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M10.58 10.58A2 2 0 0 0 13.41 13.41"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M9.88 5.09A9.77 9.77 0 0 1 12 4.86C16.5 4.86 20 12 20 12C19.47 12.99 18.79 13.9 17.99 14.69"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.26 6.26C4.1 7.73 2.73 10 2 12C2 12 5.5 19.14 12 19.14C13.78 19.14 15.36 18.61 16.73 17.76"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 12C2 12 5.5 4.86 12 4.86C18.5 4.86 22 12 22 12C22 12 18.5 19.14 12 19.14C5.5 19.14 2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 15A3 3 0 1 0 12 9A3 3 0 1 0 12 15Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder = "",
  autoComplete = "current-password",
  helperText = "",
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-[#8E97A8]">{label}</span>
      <div className="relative">
        <input
          type={isPasswordVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="w-full rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 pr-14 text-white outline-none focus:border-[#01BB96] placeholder:text-[#5D6677]"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setIsPasswordVisible((previousValue) => !previousValue)}
          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-xl p-2 text-[#8E97A8]"
          aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
          title={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
        >
          <EyeIcon isVisible={isPasswordVisible} />
        </button>
      </div>
      {helperText ? (
        <span className="text-xs leading-5 text-[#8E97A8]">{helperText}</span>
      ) : null}
    </label>
  );
}
