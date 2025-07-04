import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '@/services/resourceService';

interface User {
    githubid: string; // The user specifically asked for this
    login: string;
    name: string;
}

// 1. Define the shape of the context
interface AuthContextType {
    user: User | null;
    // You could add a logout function here later: `logout: () => void;`
  }
  
  // 2. Create the context with a default value of null
  const AuthContext = createContext<AuthContextType | null>(null);
  
  // 3. Create the Provider Component
  // This component will wrap your entire application.
  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const checkAuth = async () => {
        // The service now returns the user data on success
        const userData = await authService.checkAuthentication();
        setUser(userData);
        setIsLoading(false);
      };
  
      checkAuth();
    }, []);
  
    // While checking, show a loading screen
    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#F29C2A',
          fontSize: '1.25rem'
        }}>
          Verifying authentication...
        </div>
      );
    }
  
    // Once loaded, provide the user data to the rest of the app
    return (
      <AuthContext.Provider value={{ user }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  // 4. Create a custom hook for easy access to the context
  // This is the hook that your components will use.
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };