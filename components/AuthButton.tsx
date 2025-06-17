import React, { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
}

interface AuthState {
  checked: boolean;
  authenticated: boolean;
  user: AuthUser | null;
}

interface AuthButtonProps {
  className?: string;
  compact?: boolean;
}

const BACKEND_URL = "http://localhost:5100"; // adjust if needed

const AuthButton: React.FC<AuthButtonProps> = ({ className = "", compact = false }) => {
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/auth/check`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setAuth({ checked: true, ...data }))
      .catch(() => setAuth({ checked: true, authenticated: false, user: null }));
  }, []);

  if (!auth.checked) return null;

  // Compact style for header
  if (compact) {
    if (!auth.authenticated) {
      return (
        <a
          href={`${BACKEND_URL}/auth/github`}
          className={`flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white rounded px-3 py-1 text-sm font-medium transition-colors shadow ${className}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Sign in</span>
        </a>
      );
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-slate-200 font-medium">
          {auth.user?.displayName || auth.user?.username}
        </span>
        <a
          href={`${BACKEND_URL}/auth/logout`}
          className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs font-medium transition-colors shadow"
        >
          Logout
        </a>
      </div>
    );
  }

  // Default (non-compact) style for full page login
  return (
    <div className={`flex flex-col items-center justify-center min-h-[50vh] ${className}`}>
      {!auth.authenticated ? (
        <a
          href={`${BACKEND_URL}/auth/github`}
          className="flex items-center justify-center gap-3 bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-full px-7 py-3 shadow-lg font-semibold text-lg transition-all duration-200 border border-slate-600 hover:border-[#F29C2A] focus:outline-none focus:ring-2 focus:ring-[#F29C2A] w-full max-w-xs"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Sign in with GitHub</span>
        </a>
      ) : (
        <div className="flex flex-col items-center gap-4 bg-slate-800/70 rounded-xl shadow-xl px-8 py-6 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-xl font-bold text-[#F29C2A] uppercase">
              {auth.user?.displayName
                ? auth.user.displayName[0]
                : auth.user?.username[0]}
            </div>
            <span className="text-base text-slate-200 font-medium">
              {auth.user?.displayName || auth.user?.username}
            </span>
          </div>
          <a
            href={`${BACKEND_URL}/auth/logout`}
            className="bg-gradient-to-tr from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:to-red-600 text-white rounded-full px-5 py-2 shadow font-semibold transition-all duration-200 border border-red-700 hover:border-[#F29C2A] focus:outline-none focus:ring-2 focus:ring-[#F29C2A]"
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
};

export default AuthButton;