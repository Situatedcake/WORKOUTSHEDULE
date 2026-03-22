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
    <nav
      className="
            absolute 
            bottom-0 
            flex
            justify-evenly
            items-center
            py-0.5
            mx-6
            mb-5
            rounded-4xl
            bg-[#12151C]
            border
            border-[#383838]
            w-[calc(100%-3rem)]
            box-border
        "
    >
      {navItems.map(({ to, icon, iconActive, label }) => (
        <NavLink key={to} to={to} aria-label={label} className="rounded-2xl">
          {({ isActive }) => (
            <img src={isActive ? iconActive : icon} alt="" aria-hidden="true" />
          )}
        </NavLink>
      ))}
    </nav>
  );
}
