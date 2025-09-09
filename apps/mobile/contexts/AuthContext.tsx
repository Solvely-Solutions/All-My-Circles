import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for stored auth token
    const checkAuthState = async () => {
      setIsLoading(true);
      // Simulate async check
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    
    checkAuthState();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Mock authentication - accept any email/password
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser: User = {
      id: '1',
      email: email,
      name: email.split('@')[0].split('.').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
    };
    
    setUser(mockUser);
    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
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