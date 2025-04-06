'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../components/Login';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const parsedAuthData = JSON.parse(authData);
        const expirationTime = new Date(parsedAuthData.expires).getTime();
        const now = new Date().getTime();

        if (now < expirationTime) {
          // Si hay una sesión válida, redirigir al widget de glucosa
          router.push('/glucose');
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
        localStorage.removeItem('authData');
      }
    }
  }, [router]);

  const handleLoginSuccess = (authData: any) => {
    localStorage.setItem('authData', JSON.stringify(authData));
    router.push('/glucose');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
} 