import { NavLink } from "react-router";

import User from "/icons/navIcons/user.svg";
import Calendare from "/icons/navIcons/calendare.svg";
import Statistic from "/icons/navIcons/stats.svg";
import Home from "/icons/navIcons/home.svg";

import UserActive from "/icons/navIcons/userActive.svg";
import HomeActive from "/icons/navIcons/homeActive.svg";
import CalendareActive from "/icons/navIcons/calendareActive.svg";
import StatisticActive from "/icons/navIcons/statsActive.svg";
import { ROUTES } from "../constants/routes";

const navItems = [
  { to: ROUTES.HOME, icon: Home, iconActive: HomeActive, label: "Главная" },
  {
    to: ROUTES.STATS,
    icon: Statistic,
    iconActive: StatisticActive,
    label: "Статистика",
  },
  {
    to: ROUTES.CALENDAR,
    icon: Calendare,
    iconActive: CalendareActive,
    label: "Календарь",
  },
  { to: ROUTES.USER, icon: User, iconActive: UserActive, label: "Профиль" },
];

export default function NavMenu() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center justify-evenly rounded-4xl border border-[#383838] bg-[#12151C] py-0.5">
        {navItems.map(({ to, icon, iconActive, label }) => (
          <NavLink key={to} to={to} aria-label={label} className="rounded-2xl p-3">
            {({ isActive }) => (
              <img src={isActive ? iconActive : icon} alt="" aria-hidden="true" />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
