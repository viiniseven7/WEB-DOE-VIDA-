import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export type UserRole = 'donor' | 'staff' | 'director' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bloodType?: string;
  phone?: string;
  cpf?: string;
  donationCount?: number;
  lastDonation?: string;
  hemocenterId?: string;
  hemocentroName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  bloodType?: string;
  phone?: string;
  cpf?: string;
  hemocenterId?: string;
  hemocentroName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f9f63502`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (accessToken) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } catch (error) {
          console.error('Error checking session:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        sessionStorage.setItem('justLoggedIn', 'true');
        return true;
      } else {
        console.error('Login error:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Login request error:', error);
      return false;
    }
  };

  const signup = async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro ao criar conta' };
      }
    } catch (error) {
      console.error('Signup request error:', error);
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup,
      logout, 
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}