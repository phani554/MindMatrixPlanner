
import React from 'react';

export const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.091M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const UserIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

export const ClipboardListIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.172A48.424 48.424 0 0 0 12 3c-2.392 0-4.744.175-7.024.536C3.845 3.898 3 4.854 3 6.108V18.75c0 1.243 1.007 2.25 2.25 2.25H9M12.75 3.75v11.25A2.25 2.25 0 0 0 15 17.25h3.375c.621 0 1.125-.504 1.125-1.125V6.375a1.125 1.125 0 0 0-.625-1.026l-3.375-1.75A1.125 1.125 0 0 0 12.75 3.75Z" />
  </svg>
);

export const LinkIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className}>
    <path d="M7.775 3.275a.75.75 0 0 0-1.06 1.06l1.25 1.25a2.5 2.5 0 1 0 3.536 3.536l1.25 1.25a.75.75 0 1 0 1.06-1.06l-1.25-1.25a4 4 0 0 0-5.656-5.656l-1.25-1.25a.75.75 0 0 0-1.06 1.06l1.25 1.25Z" />
    <path d="M8.225 12.725a.75.75 0 0 0 1.06-1.06l-1.25-1.25a2.5 2.5 0 0 0-3.536-3.536L3.25 5.625a.75.75 0 0 0-1.06 1.06l1.25 1.25a4 4 0 0 0 5.656 5.656l1.25 1.25a.75.75 0 1 0 1.06-1.06l-1.25-1.25Z" />
  </svg>
);

export const PlayIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className}>
    <path d="M2.5 3.5c0-.828.672-1.5 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 2.5 12.5v-9ZM4 4.75v6.5l4.5-3.25L4 4.75Z" />
  </svg>
);

export const PauseIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className}>
    <path d="M2.5 3.5c0-.828.672-1.5 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 2.5 12.5v-9ZM6 5.25a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Zm5.5 0a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Z" />
  </svg>
);

export const ReportIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.976 2.093c-.542.542-1.232.893-1.96.983V15.75M9 17.25c3.286 0 6-2.686 6-6S12.286 5.25 9 5.25C5.714 5.25 3 7.936 3 11.25s2.714 6 6 6Zm9.75-1.125V15.75c0-1.254-.463-2.443-1.29-3.335S15.754 11.25 14.5 11.25H9c-.986 0-1.92.297-2.721.829A6.017 6.017 0 0 1 9 11.25c1.982 0 3.802.783 5.163 2.08.98.878 1.587 2.073 1.587 3.37Zm-2.149-3.868c.435-.37.77-.821 1.009-1.326M18 17.25c.041-.162.077-.327.108-.495" />
  </svg>
);

export const DashboardIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 .895-.895c.161-.16.344-.303.544-.431C4.696 10.035 6.097 9.5 7.5 9.5c1.402 0 2.804.535 3.86.169.199-.128.383-.271.544-.431L12.895 7.5l.895-.895c.161-.16.344-.303.544-.431C15.396 5.535 16.798 5 18.25 5c1.403 0 2.804.535 3.86.169.2-.128.383-.271.544-.431L21.75 3M2.25 12v6.75a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V12M2.25 12V5.25A2.25 2.25 0 0 1 4.5 3h15a2.25 2.25 0 0 1 2.25 2.25V12M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const TeamIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-3.741-5.665M18 18.72v-5.665m0 5.665v-5.665m0 5.665L18.75 17.25m-6-6.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 17.25v-5.665m0 5.665L18 18.72m-6-6.75v-5.665m0 5.665v5.665m0 0L12.75 17.25m-6-6.75L6.75 17.25M6.75 17.25v-5.665m0 5.665v5.665m0 0L6 18.72m-3-3.72a9.094 9.094 0 0 0 3.741.479 3 3 0 0 0-3.741-5.665M3 15v5.665m0 0v-5.665m0 0L2.25 17.25M12 12a2.25 2.25 0 0 0-2.25 2.25v1.5A2.25 2.25 0 0 0 12 18a2.25 2.25 0 0 0 2.25-2.25v-1.5A2.25 2.25 0 0 0 12 12Z" />
  </svg>
);

export const TimesheetIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const CakeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 3.002a3.001 3.001 0 012.533 1.494C12.868 4.662 13 5.074 13 5.5a2 2 0 01-2 2 .998.998 0 01-.707-.293A3.001 3.001 0 0110 7c-.689 0-1.312.234-1.793.621a3.002 3.002 0 01-2.914-.015A.998.998 0 015 7.293a2 2 0 01-2-2c0-.426.132-.838.467-1.004A3.001 3.001 0 016 3c.988 0 1.893.473 2.446 1.225A2.999 2.999 0 0110 3.002zM10 8.5a.5.5 0 000-1 .5.5 0 000 1zM6.31 9.383A3.5 3.5 0 004.5 11.43V12a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-.57a3.5 3.5 0 00-1.81-2.047A3.501 3.501 0 0010 10.5c-1.112 0-2.108.306-2.935.82a3.482 3.482 0 00-.755-.062zM4 13.5v1A1.5 1.5 0 005.5 16h9a1.5 1.5 0 001.5-1.5v-1H4z" />
  </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
  </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-3.75h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
  </svg>
);


// MindMatrix logo (SVG representation)
export const MindMatrixLogo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
    <svg viewBox="0 0 440 140" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="mmNewSwooshGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAD02C" /> {/* var(--mm-accent-orange-light) */}
          <stop offset="50%" stopColor="#F29C2A" /> {/* var(--mm-accent-orange) */}
          <stop offset="100%" stopColor="#EE4D1E" /> {/* var(--mm-accent-orange-deep) */}
        </linearGradient>
      </defs>
      <path d="M 50 70 Q 220 20 390 70 L 380 75 Q 220 45 60 75 Z" fill="url(#mmNewSwooshGrad)" />
      <circle cx="60" cy="65" r="7" fill="#E2E8F0" />
      <circle cx="380" cy="65" r="7" fill="#E2E8F0" />
      <text x="220" y="100" fontFamily="Arial, Helvetica, sans-serif" fontSize="50" fontWeight="bold" fill="#E2E8F0" textAnchor="middle" dominantBaseline="middle">mindmatrix</text>
      <text x="220" y="125" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fill="#E2E8F0" textAnchor="middle" dominantBaseline="middle">One Platform: Enabling Sales Ecosystems</text>
    </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
  </svg>
);
