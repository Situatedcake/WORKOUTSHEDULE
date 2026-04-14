const DEFAULT_THEME_ICONS = {
  library: "/icons/library.svg",
  question: "/icons/quastion.svg",
  training: "/icons/addTraning.svg",
  arrowRight: "/icons/arrowRight.svg",
  arrowBack: "/icons/arrowBack.svg",
  clock: "/icons/clock.svg",
  menu: "/menu.svg",
  triangle: "/icons/triangle.svg",
  navHome: "/icons/navIcons/Home.svg",
  navHomeActive: "/icons/navIcons/homeActive.svg",
  navCalendar: "/icons/navIcons/Calendare.svg",
  navCalendarActive: "/icons/navIcons/CalendareActive.svg",
  navStats: "/icons/navIcons/Stats.svg",
  navStatsActive: "/icons/navIcons/statsActive.svg",
  navUser: "/icons/navIcons/User.svg",
  navUserActive: "/icons/navIcons/userActive.svg",
};

const LIGHT_THEME_ICONS = {
  library: "/icons/light/library.svg",
  question: "/icons/light/quastion.svg",
  training: "/icons/light/addTraning.svg",
  arrowRight: "/icons/light/arrowRight.svg",
  arrowBack: "/icons/light/arrowBack.svg",
  clock: "/icons/light/clock.svg",
  menu: "/icons/light/menu.svg",
  navHome: "/icons/light/navIcons/Home.svg",
  navHomeActive: "/icons/light/navIcons/homeActive.svg",
  navCalendar: "/icons/light/navIcons/Calendare.svg",
  navCalendarActive: "/icons/light/navIcons/CalendareActive.svg",
  navStats: "/icons/light/navIcons/Stats.svg",
  navStatsActive: "/icons/light/navIcons/statsActive.svg",
  navUser: "/icons/light/navIcons/User.svg",
  navUserActive: "/icons/light/navIcons/userActive.svg",
};

export function getThemeIcon(theme, iconKey) {
  if (theme === "light" && LIGHT_THEME_ICONS[iconKey]) {
    return LIGHT_THEME_ICONS[iconKey];
  }

  return DEFAULT_THEME_ICONS[iconKey] ?? "";
}
