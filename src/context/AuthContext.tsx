import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth0, User } from '@auth0/auth0-react';
import { useToast } from '@/hooks/use-toast';

interface LoginOptions {
  connection?: 'google-oauth2' | 'email' | string;
}

interface AuthContextType {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | undefined;
  loginWithRedirect: (options?: LoginOptions) => void;
  loginWithGoogle: () => void;
  loginWithMagicLink: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect: auth0Login,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();
  const { toast } = useToast();

  // Handle Auth0 errors
  useEffect(() => {
    if (error) {
      console.error('Auth0 error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message || 'Failed to authenticate. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Check for error in URL params (Auth0 returns errors via URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      console.error('Auth0 URL error:', errorParam, errorDescription);
      toast({
        title: 'Authentication Failed',
        description: errorDescription || `Error: ${errorParam}`,
        variant: 'destructive',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const loginWithRedirect = (options?: LoginOptions) => {
    // Use smart redirect detection matching Auth0Provider config
    const origin = window.location.origin;
    const redirectUri = origin.includes('lithiumbuy.com') 
      ? 'https://lithiumbuy.com' 
      : origin;
    
    console.log('[Auth] Initiating login with redirect:', redirectUri, 'connection:', options?.connection);
    
    auth0Login({
      authorizationParams: {
        redirect_uri: redirectUri,
        ...(options?.connection && { connection: options.connection }),
      },
    }).catch((err) => {
      console.error('Login redirect error:', err);
      
      // Check for specific Auth0 errors
      const errorMessage = err?.message?.toLowerCase() || '';
      if (errorMessage.includes('callback') || errorMessage.includes('redirect')) {
        toast({
          title: 'Configuration Error',
          description: 'Redirect URL mismatch. Please contact support.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: 'Unable to initiate login. Please check your connection and try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const loginWithGoogle = () => {
    loginWithRedirect({ connection: 'google-oauth2' });
  };

  const loginWithMagicLink = () => {
    loginWithRedirect({ connection: 'email' });
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const getAccessToken = async (): Promise<string> => {
    try {
      const token = await getAccessTokenSilently();
      return token;
    } catch (err) {
      console.error('Failed to get access token:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        loginWithRedirect,
        loginWithGoogle,
        loginWithMagicLink,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
