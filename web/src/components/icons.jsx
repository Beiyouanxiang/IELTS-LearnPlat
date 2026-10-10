// 统一图标集：内联 SVG，stroke 风格，随字体色变化
const S = ({ children, size, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size || '1em'}
    height={size || '1em'}
    {...rest}
  >
    {children}
  </svg>
);

export const IcoDashboard = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
    <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
  </S>
);

export const IcoCards = (p) => (
  <S {...p}>
    <rect x="3" y="6" width="13" height="15" rx="2.5" />
    <path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V18" />
    <path d="M7 11h5M7 15h3" />
  </S>
);

export const IcoBook = (p) => (
  <S {...p}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 21z" />
    <path d="M4 18.5h16" />
    <path d="M9 7h7M9 11h5" />
  </S>
);

export const IcoTarget = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </S>
);

export const IcoHeadphones = (p) => (
  <S {...p}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="2.5" y="14" width="4.5" height="7" rx="2" />
    <rect x="17" y="14" width="4.5" height="7" rx="2" />
  </S>
);

export const IcoSparkles = (p) => (
  <S {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  </S>
);

export const IcoSettings = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2v.17a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.2 14.5a1.7 1.7 0 0 0-1.55-1.1H2.5a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.2 8.28a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H8.7a1.7 1.7 0 0 0 1.11-1.55V2.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 2.87 1.2l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09A1.7 1.7 0 0 0 21.5 9.7h.17a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1.11z" />
  </S>
);

export const IcoSearch = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.6-3.6" />
  </S>
);

export const IcoSun = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" />
  </S>
);

export const IcoMoon = (p) => (
  <S {...p}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </S>
);

export const IcoFlame = (p) => (
  <S {...p}>
    <path d="M12 2.5s1.6 3 1.6 5.2c0 1.9-1.3 2.9-1.3 2.9s-.5-1-1.5-1.9c-.3 1.7-2 2.7-2 5 0 2.4 2.1 4.3 4.6 4.3s4.6-2 4.6-4.6c0-4.9-5.9-6.4-6-10.9z" />
    <path d="M8.4 15.8c-.6.9-.9 1.9-.9 2.9A2.9 2.9 0 0 0 9 21" />
  </S>
);

export const IcoSpeaker = (p) => (
  <S {...p}>
    <path d="M11 5L6.5 8.8H3.4a.9.9 0 0 0-.9.9v4.6a.9.9 0 0 0 .9.9h3.1L11 19z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </S>
);

export const IcoCheck = (p) => (
  <S {...p}>
    <path d="M20 6.5L9.5 17 4 11.5" />
  </S>
);

export const IcoX = (p) => (
  <S {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </S>
);

export const IcoChevronL = (p) => (
  <S {...p}>
    <path d="M15 5l-7 7 7 7" />
  </S>
);

export const IcoChevronR = (p) => (
  <S {...p}>
    <path d="M9 5l7 7-7 7" />
  </S>
);

export const IcoArrowRight = (p) => (
  <S {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </S>
);

export const IcoTrophy = (p) => (
  <S {...p}>
    <path d="M7 4h10v5.5a5 5 0 0 1-10 0z" />
    <path d="M7 5.5H4.5A2.5 2.5 0 0 0 7 10M17 5.5h2.5A2.5 2.5 0 0 1 17 10" />
    <path d="M12 14.5V18M8.5 21h7M10 18h4" />
  </S>
);

export const IcoTrendUp = (p) => (
  <S {...p}>
    <path d="M3 17l5.5-5.5 3.5 3.5L21 6" />
    <path d="M15.5 6H21v5.5" />
  </S>
);

export const IcoPlus = (p) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const IcoUpload = (p) => (
  <S {...p}>
    <path d="M12 16V4M7.5 8.5L12 4l4.5 4.5" />
    <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
  </S>
);

export const IcoPlay = (p) => (
  <S {...p}>
    <path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" stroke="none" />
  </S>
);

export const IcoRotate = (p) => (
  <S {...p}>
    <path d="M20 11a8 8 0 1 1-2.3-5.4" />
    <path d="M20 4v5h-5" />
  </S>
);

export const IcoList = (p) => (
  <S {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </S>
);

export const IcoGrid = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </S>
);

export const IcoKeyboard = (p) => (
  <S {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <path d="M6.5 9.5h.01M10 9.5h.01M13.5 9.5h.01M17 9.5h.01M8 14h8" />
  </S>
);

export const IcoBrain = (p) => (
  <S {...p}>
    <path d="M9.5 3.5A3 3 0 0 0 6.6 6a2.8 2.8 0 0 0-1.9 4.8A3 3 0 0 0 6 16a2.8 2.8 0 0 0 3.5 3.6V3.5z" />
    <path d="M14.5 3.5A3 3 0 0 1 17.4 6a2.8 2.8 0 0 1 1.9 4.8A3 3 0 0 1 18 16a2.8 2.8 0 0 1-3.5 3.6V3.5z" />
  </S>
);

export const IcoZap = (p) => (
  <S {...p}>
    <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z" />
  </S>
);

export const IcoClock = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </S>
);

export const IcoLogout = (p) => (
  <S {...p}>
    <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </S>
);

export const IcoUser = (p) => (
  <S {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </S>
);

export const IcoLayers = (p) => (
  <S {...p}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </S>
);

export const IcoCalendar = (p) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </S>
);

export const IcoStar = ({ filled, ...p }) => (
  <S {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.6l2.6 5.3 5.9.85-4.25 4.14 1 5.86L12 17.02 6.75 19.75l1-5.86L3.5 9.75l5.9-.85z" />
  </S>
);

export const IcoMic = (p) => (
  <S {...p}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M9 21.5h6" />
  </S>
);

export const IcoWave = (p) => (
  <S {...p}>
    <path d="M2 12h2.5l2-6 3 13 3-16 3 12 2-3H22" />
  </S>
);

export const IcoPen = (p) => (
  <S {...p}>
    <path d="M4 20h4l10-10-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </S>
);

export const IcoTrash = (p) => (
  <S {...p}>
    <path d="M4 7h16M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3V7" />
    <path d="M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7" />
  </S>
);

export const IcoFilm = (p) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M7.5 4.5v15M16.5 4.5v15M3 12h18M3 8.2h4.5M3 15.8h4.5M16.5 8.2H21M16.5 15.8H21" />
  </S>
);

export const IcoChart = (p) => (
  <S {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 16V10M12.5 16V6.5M17 16v-4" />
  </S>
);

export const IcoFileText = (p) => (
  <S {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </S>
);

export const IcoSend = (p) => (
  <S {...p}>
    <path d="M21 3L10.5 13.5" />
    <path d="M21 3l-6.8 18-3.7-7.5L3 9.5z" />
  </S>
);

export const IcoEye = (p) => (
  <S {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);

export const IcoRadar = (p) => (
  <S {...p}>
    <path d="M12 3l8 6-3 10H7L4 9z" />
    <path d="M12 8l3.5 2.6-1.3 4.4H9.8L8.5 10.6z" />
  </S>
);

export const IcoRead = (p) => (
  <S {...p}>
    <path d="M12 6.5S10 4.5 6.5 4.5A2.5 2.5 0 0 0 4 7v11a2.5 2.5 0 0 1 2.5-2.5c3.5 0 5.5 2 5.5 2z" />
    <path d="M12 6.5S14 4.5 17.5 4.5A2.5 2.5 0 0 1 20 7v11a2.5 2.5 0 0 0-2.5-2.5c-3.5 0-5.5 2-5.5 2z" />
    <path d="M12 6.5v11" />
  </S>
);

export const IcoQuote = (p) => (  <S {...p}>
    <path d="M9 7H5.5A1.5 1.5 0 0 0 4 8.5V12a1.5 1.5 0 0 0 1.5 1.5H8c0 2-1 3-3 3" />
    <path d="M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12a1.5 1.5 0 0 0 1.5 1.5H18c0 2-1 3-3 3" />
  </S>
);
