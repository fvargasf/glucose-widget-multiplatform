'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlucoseGraph from './components/GlucoseGraph';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (!authData) {
      router.push('/login');
    } else {
      try {
        const parsedAuthData = JSON.parse(authData);
        const expirationTime = new Date(parsedAuthData.expires).getTime();
        const now = new Date().getTime();

        if (now >= expirationTime) {
          localStorage.removeItem('authData');
          router.push('/login');
        } else {
          router.push('/glucose');
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
        localStorage.removeItem('authData');
        router.push('/login');
      }
    }
  }, [router]);

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
