import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { authService } from '@/services/resourceService';
import { User } from '../types.ts';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

// 2. Creates the context with default values.
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {}, // Default empty function
});

// 3. The Provider component that will wrap your application.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On initial application load, check if the user is authenticated.
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // authService.checkAuthentication will either return user data on success
        // or redirect the browser to the login page on failure.
        const userData = await authService.checkAuthentication();
        setUser(userData);
      } catch (error) {
        // This catch block will likely not be hit if redirection occurs,
        // but is kept as a safeguard.
        console.error('An unhandled error occurred during authentication check:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // The empty dependency array ensures this runs only once.

  /**
   * Provides a stable logout function to the rest of the app.
   * `authService.logout` handles the API call and browser redirection.
   */
  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  /**
   * Memoizes the context value to prevent unnecessary re-renders in consumer components.
   * It only creates a new object if `user`, `isLoading`, or `logout` changes.
   */
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user, // Derived boolean for easy checking.
      logout,
    }),
    [user, isLoading, logout]
  );

  // Display a full-screen loader while verifying authentication.
  if (value.isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#F29C2A',
          fontSize: '1.25rem',
        }}
      >
        Verifying authentication...
      </div>
    );
  }

  // Once loaded, provide the context to the rest of the application.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. A custom hook for easy and safe access to the context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};