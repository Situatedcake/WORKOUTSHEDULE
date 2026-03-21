import { NavLink } from "react-router";

import User from "/icons/navIcons/User.svg";
import Calendare from "/icons/navIcons/Calendare.svg";
import Statistic from "/icons/navIcons/Stats.svg";
import Home from "/icons/navIcons/Home.svg";

import UserActive from "/icons/navIcons/userActive.svg";
import HomeActive from "/icons/navIcons/homeActive.svg";
import CalendareActive from "/icons/navIcons/CalendareActive.svg";

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
        "
    >
      <NavLink to="/">
        {({ isActive }) => (
          <img src={isActive ? HomeActive : Home} alt="home" />
        )}
      </NavLink>
      <NavLink to="/stats">
        <img src={Statistic} alt="stats" />
      </NavLink>
      <NavLink to="/StartTraningPage">
        {({ isActive }) => (
          <img src={isActive ? CalendareActive : Calendare} alt="calendar" />
        )}
      </NavLink>
      <NavLink to="/user">
        {({ isActive }) => (
          <img src={isActive ? UserActive : User} alt="user" />
        )}
      </NavLink>
    </nav>
  );
}
