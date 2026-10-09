const paths = {
  play: <path d="m8 5 12 7-12 7V5Z" fill="currentColor" stroke="none" />,
  android: <><path d="M6 9h12v9H6zM6 9a6 6 0 0 1 12 0M8 3 6 1m10 2 2-2M3 10v7m18-7v7M9 18v4m6-4v4" /><path d="M9 6h.01M15 6h.01" stroke="#201208" /></>,
  beer: <><path d="M5 7v14h11V7m0 3h4v7h-4M8 11v7m5-7v7" /><path d="M5 7a3 3 0 1 1 2-5 3 3 0 0 1 5-1 3 3 0 0 1 4 6H5Z" /></>,
  users: <><circle cx="12" cy="6" r="3" /><path d="M6 21v-4a6 6 0 0 1 12 0v4M4 9a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M1 21v-3m22 3v-3" /></>,
  zap: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" fill="currentColor" stroke="none" />,
  heart: <path d="M12 21 3 12C-3 5 6-1 12 6c6-7 15-1 9 6l-9 9Z" fill="currentColor" stroke="none" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="m5 5 14 14M5 19 19 5" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
}

export default function Icon({ name, className = '' }) {
  return <svg className={`site-icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
