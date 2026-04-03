export function getTierMeta(tierKey) {
  switch (tierKey) {
    case "bronze":
      return {
        badgeClassName: "bg-[#3A2418] text-[#E8B28A]",
        borderClassName: "border-[#6B4A33]",
        panelClassName:
          "border-[#6B4A33] bg-[radial-gradient(circle_at_top,_rgba(180,112,73,0.24),_transparent_58%),linear-gradient(180deg,#17110E_0%,#0B0E15_100%)]",
        accentClassName: "text-[#E8B28A]",
        progressClassName:
          "bg-[linear-gradient(90deg,#B47049_0%,#E8B28A_100%)]",
      };
    case "silver":
      return {
        badgeClassName: "bg-[#1B2634] text-[#C8D7E6]",
        borderClassName: "border-[#5A6C80]",
        panelClassName:
          "border-[#5A6C80] bg-[radial-gradient(circle_at_top,_rgba(167,186,205,0.22),_transparent_58%),linear-gradient(180deg,#141922_0%,#0B0E15_100%)]",
        accentClassName: "text-[#DCE7F1]",
        progressClassName:
          "bg-[linear-gradient(90deg,#93A9BF_0%,#DCE7F1_100%)]",
      };
    case "gold":
      return {
        badgeClassName: "bg-[#3B290D] text-[#FFD37A]",
        borderClassName: "border-[#8B6A18]",
        panelClassName:
          "border-[#8B6A18] bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.24),_transparent_58%),linear-gradient(180deg,#17130A_0%,#0B0E15_100%)]",
        accentClassName: "text-[#FFD37A]",
        progressClassName:
          "bg-[linear-gradient(90deg,#F59E0B_0%,#FDE68A_100%)]",
      };
    case "platinum":
      return {
        badgeClassName: "bg-[#0F2D33] text-[#8EE8F5]",
        borderClassName: "border-[#1D6C79]",
        panelClassName:
          "border-[#1D6C79] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_58%),linear-gradient(180deg,#101A1F_0%,#0B0E15_100%)]",
        accentClassName: "text-[#A7F3FC]",
        progressClassName:
          "bg-[linear-gradient(90deg,#06B6D4_0%,#A5F3FC_100%)]",
      };
    case "legend":
      return {
        badgeClassName: "bg-[#29153F] text-[#E2C1FF]",
        borderClassName: "border-[#7C3AED]",
        panelClassName:
          "border-[#7C3AED] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.26),_transparent_58%),linear-gradient(180deg,#171024_0%,#0B0E15_100%)]",
        accentClassName: "text-[#E9D5FF]",
        progressClassName:
          "bg-[linear-gradient(90deg,#7C3AED_0%,#C084FC_100%)]",
      };
    case "starter":
    default:
      return {
        badgeClassName: "bg-[#143423] text-[#8CF0B8]",
        borderClassName: "border-[#1F6A55]",
        panelClassName:
          "border-[#1F6A55] bg-[radial-gradient(circle_at_top,_rgba(1,187,150,0.18),_transparent_58%),linear-gradient(180deg,#141922_0%,#0B0E15_100%)]",
        accentClassName: "text-[#A7F3D0]",
        progressClassName:
          "bg-[linear-gradient(90deg,#01BB96_0%,#7DD3FC_100%)]",
      };
  }
}

export function getRarityMeta(rarityKey) {
  switch (rarityKey) {
    case "rare":
      return {
        labelClassName: "bg-[#102C40] text-[#8BD1FF]",
        ringClassName: "border-[#2E5878]",
        glowClassName: "from-[#102C40] to-[#0B0E15]",
      };
    case "epic":
      return {
        labelClassName: "bg-[#2A1745] text-[#D6B4FF]",
        ringClassName: "border-[#6941C6]",
        glowClassName: "from-[#2A1745] to-[#0B0E15]",
      };
    case "legendary":
      return {
        labelClassName: "bg-[#3B290D] text-[#FFD37A]",
        ringClassName: "border-[#F59E0B]",
        glowClassName: "from-[#3B290D] to-[#0B0E15]",
      };
    case "common":
    default:
      return {
        labelClassName: "bg-[#1A1F2A] text-[#B9C1CF]",
        ringClassName: "border-[#2A3140]",
        glowClassName: "from-[#141922] to-[#0B0E15]",
      };
  }
}

export function getMomentumMeta(momentumKey) {
  switch (momentumKey) {
    case "hot":
      return {
        label: "На волне",
        badgeClassName: "bg-[#143423] text-[#8CF0B8]",
        accentClassName: "text-[#8CF0B8]",
      };
    case "steady":
      return {
        label: "Стабильно",
        badgeClassName: "bg-[#102C40] text-[#8BD1FF]",
        accentClassName: "text-[#8BD1FF]",
      };
    case "building":
      return {
        label: "Набираешь ход",
        badgeClassName: "bg-[#3A2C10] text-[#F6D27D]",
        accentClassName: "text-[#F6D27D]",
      };
    case "starting":
    default:
      return {
        label: "Старт",
        badgeClassName: "bg-[#1A1F2A] text-[#B9C1CF]",
        accentClassName: "text-[#B9C1CF]",
      };
  }
}
