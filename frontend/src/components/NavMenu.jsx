import { NavLink } from "react-router";

import User from "/icons/navIcons/User.svg";
import Calendare from "/icons/navIcons/Calendare.svg";
import Statistic from "/icons/navIcons/Stats.svg";
import Home from "/icons/navIcons/Home.svg";

import UserActive from "/icons/navIcons/userActive.svg";
import HomeActive from "/icons/navIcons/homeActive.svg";
import CalendareActive from "/icons/navIcons/CalendareActive.svg";
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
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(3px+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center justify-evenly rounded-4xl border border-[#383838] bg-[#12151C]/92 py-[1px] shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-md">
        {navItems.map(({ to, icon, iconActive, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className="rounded-3xl px-2 py-[1px] transition active:scale-[0.97]"
          >
            {({ isActive }) => (
              <img
                src={isActive ? iconActive : icon}
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
