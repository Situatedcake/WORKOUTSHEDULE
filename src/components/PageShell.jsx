import NavMenu from "./NavMenu";

export default function PageShell({
  children,
  className = "",
  showNavMenu = true,
}) {
  const bottomSpacingClassName = showNavMenu ? "pb-28" : "pb-6";

  return (
    <>
      <main className={`min-h-screen px-5 ${bottomSpacingClassName} ${className}`}>
        {children}
      </main>
      {showNavMenu ? <NavMenu /> : null}
    </>
  );
}
