import { NavLink } from "react-router";
import { ROUTES } from "../constants/routes";
import { useTheme } from "../hooks/useTheme";
import { getThemeIcon } from "../shared/themeIcons";

const navItems = [
  {
    to: ROUTES.HOME,
    iconKey: "navHome",
    iconActiveKey: "navHomeActive",
    label: "Р“Р»Р°РІРЅР°СЏ",
  },
  {
    to: ROUTES.STATS,
    iconKey: "navStats",
    iconActiveKey: "navStatsActive",
    label: "РЎС‚Р°С‚РёСЃС‚РёРєР°",
  },
  {
    to: ROUTES.CALENDAR,
    iconKey: "navCalendar",
    iconActiveKey: "navCalendarActive",
    label: "РљР°Р»РµРЅРґР°СЂСЊ",
  },
  {
    to: ROUTES.USER,
    iconKey: "navUser",
    iconActiveKey: "navUserActive",
    label: "РџСЂРѕС„РёР»СЊ",
  },
];

export default function NavMenu() {
  const { theme } = useTheme();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(15px+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center justify-evenly rounded-4xl border border-[var(--border-soft)] bg-[var(--surface-primary-92)] py-[1px] shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-md">
        {navItems.map(({ to, iconKey, iconActiveKey, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className="rounded-3xl px-2 py-[1px] transition active:scale-[0.97]"
          >
            {({ isActive }) => (
              <img
                src={getThemeIcon(theme, isActive ? iconActiveKey : iconKey)}
                alt=""
                aria-hidden="true"
                className="h-[4.5rem] w-[4.5rem]"
              />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
