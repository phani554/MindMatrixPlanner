import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Authentication wrapper component
const AuthenticationWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication when the component mounts
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5100/api/auth-required', {
          credentials: 'include' // Important: include cookies for authentication
        });
        
        if (!response.ok) {
          const data = await response.json();
          // Redirect to login page if not authenticated
          window.location.href = data.loginUrl || 'http://localhost:5100/auth/login';
          return;
        }
        
        // If we get here, user is authenticated
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, redirect to login
        window.location.href = 'http://localhost:5100/auth/login';
      }
    };

    checkAuth();
  }, []);

  // Show loading state until authentication check completes
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

  // Authentication check passed, render the app
  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthenticationWrapper />
  </React.StrictMode>
);