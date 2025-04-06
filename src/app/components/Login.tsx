'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AuthData {
  token: string;
  userId: string;
  accountId: string;
  duration: number;
  expirationTime?: number;
}

interface LoginProps {
  onLoginSuccess: (authData: AuthData) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay datos de autenticación válidos en localStorage
    const checkStoredAuth = () => {
      const storedAuthData = localStorage.getItem('authData');
      if (storedAuthData) {
        try {
          const authData: AuthData = JSON.parse(storedAuthData);
          const now = new Date().getTime();

          // Si no hay tiempo de expiración calculado, calcularlo
          if (!authData.expirationTime) {
            authData.expirationTime = now + authData.duration;
            localStorage.setItem('authData', JSON.stringify(authData));
          }

          if (now < authData.expirationTime) {
            // Si los datos son válidos y no han expirado, hacer login automático
            onLoginSuccess(authData);
            return;
          } else {
            // Si los datos han expirado, limpiarlos
            localStorage.removeItem('authData');
          }
        } catch (err) {
          // Si hay algún error al parsear los datos, eliminarlos
          localStorage.removeItem('authData');
        }
      }
      setLoading(false);  // Solo mostrar el formulario si no hay datos válidos
    };

    checkStoredAuth();
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth', {
        username,
        password
      });

      const now = new Date().getTime();
      const authData: AuthData = {
        token: response.data.token,
        userId: response.data.userId,
        accountId: response.data.accountId,
        duration: response.data.duration,
        expirationTime: now + response.data.duration
      };

      try {
        // Intentar guardar en localStorage
        localStorage.setItem('authData', JSON.stringify(authData));
        
        // Verificar que se guardaron correctamente
        const storedData = localStorage.getItem('authData');
        
        if (!storedData) {
          throw new Error('No se pudieron guardar los datos en localStorage');
        }
      } catch (storageError) {
        console.error('Error al guardar en localStorage:', storageError);
        setError('Error al guardar los datos de sesión');
        setLoading(false);
        return;
      }

      onLoginSuccess(authData);
    } catch (err) {
      console.error('Error en el login:', err);
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  // Mostrar un loading mientras se verifica el localStorage
  if (loading && !error) {
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#000000',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '24px',
          marginBottom: '20px',
          textAlign: 'center',
          fontFamily: 'system-ui'
        }}>
          Glucose Monitoring Login
        </h1>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email"
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2d2d2d',
                border: '1px solid #3d3d3d',
                borderRadius: '5px',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2d2d2d',
                border: '1px solid #3d3d3d',
                borderRadius: '5px',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          </div>
          {error && (
            <div style={{
              color: '#ff4444',
              textAlign: 'center',
              marginTop: '10px'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
