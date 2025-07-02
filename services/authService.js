// Authentication service for GitHub OAuth
const API_URL = 'http://localhost:5100';

export const authService = {
  // Initiate GitHub login by redirecting to the backend auth route
  loginWithGitHub: () => {
    window.location.href = `${API_URL}/auth/github`;
  },

  // Check if user is authenticated
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/user`, {
        credentials: 'include', // Important: sends cookies with the request
      });

      console.log(response);
      
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return null;
    }
  },

  // Logout user
  logout: () => {
    window.location.href = `${API_URL}/auth/logout`;
  }
};

authService.getCurrentUser();