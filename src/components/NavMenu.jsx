import { NavLink } from "react-router";

import User from "/icons/navIcons/user.svg";
import Calendare from "/icons/navIcons/calendare.svg";
import Statistic from "/icons/navIcons/stats.svg";
import Home from "/icons/navIcons/home.svg";

import UserActive from "/icons/navIcons/userActive.svg";
import HomeActive from "/icons/navIcons/homeActive.svg";
import CalendareActive from "/icons/navIcons/calendareActive.svg";
import StatisticActive from "/icons/navIcons/statsActive.svg";

const NavComponent = ({ icon, iconActive, to }) => {
  return (
    <NavLink to={to}>
      {({ isActive }) => <img src={isActive ? iconActive : icon} alt={icon} />}
    </NavLink>
  );
};

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
      <NavComponent to="/" icon={Home} iconActive={HomeActive} />
      <NavComponent to="/stats" icon={Statistic} iconActive={StatisticActive} />
      <NavComponent
        to="/calendare"
        icon={Calendare}
        iconActive={CalendareActive}
      />
      <NavComponent to="/user" icon={User} iconActive={UserActive} />
    </nav>
  );
}
