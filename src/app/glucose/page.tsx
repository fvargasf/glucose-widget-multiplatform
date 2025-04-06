'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GlucoseGraph from '../components/GlucoseGraph';

interface AuthData {
  token: string;
  userId: string;
  accountId: string;
  duration: number;
  expirationTime?: number;
}

export default function GlucosePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedAuthData = localStorage.getItem('authData');
        
        if (!storedAuthData) {
          console.log('No auth data found, redirecting to login');
          router.push('/login');
          return;
        }

        const authData: AuthData = JSON.parse(storedAuthData);
        const now = new Date().getTime();

        // Si no hay tiempo de expiración calculado, calcularlo y guardarlo
        if (!authData.expirationTime) {
          authData.expirationTime = now + authData.duration;
          localStorage.setItem('authData', JSON.stringify(authData));
        }

        if (now >= authData.expirationTime) {
          localStorage.removeItem('authData');
          router.push('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('authData');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authData');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#000000', padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#ffffff', 
          fontSize: '24px',
          fontFamily: 'system-ui'
        }}>
          Glucose Monitoring
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <GlucoseGraph />
      </div>
    </div>
  );
} 