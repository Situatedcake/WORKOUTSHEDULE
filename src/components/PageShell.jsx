import NavMenu from "./NavMenu";

export default function PageShell({
  children,
  className = "",
  showNavMenu = true,
}) {
  const bottomSpacingClassName = showNavMenu
    ? "pb-[calc(7rem+env(safe-area-inset-bottom))]"
    : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]";

  return (
    <>
      <main
        className={`min-h-[100dvh] px-5 ${bottomSpacingClassName} ${className}`}
      >
        {children}
      </main>
      {showNavMenu ? <NavMenu /> : null}
    </>
  );
}
