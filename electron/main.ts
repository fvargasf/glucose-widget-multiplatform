import { app, BrowserWindow, session } from 'electron';
import isDev from 'electron-is-dev';
import { spawn } from 'child_process';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let nextServer: any = null;

function createWindow() {
  // Crear la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      partition: 'persist:glucose'
    },
    autoHideMenuBar: true
  });

  // Configurar CSP para permitir localStorage
  session.fromPartition('persist:glucose').webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';" +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
          "style-src 'self' 'unsafe-inline';" +
          "connect-src 'self' http://localhost:* https://*;" +
          "img-src 'self' data: blob:;" +
          "media-src 'self';" +
          "object-src 'none';"
        ]
      }
    });
  });

  // Cargar la URL inicial
  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(url);

  // Abrir las herramientas de desarrollo si estamos en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Verificar que localStorage está funcionando
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.executeJavaScript(`
      try {
        console.log('Testing localStorage...');
        localStorage.setItem('test', 'test');
        const testValue = localStorage.getItem('test');
        console.log('localStorage test value:', testValue);
        localStorage.removeItem('test');
        console.log('localStorage is working correctly');
      } catch (e) {
        console.error('Error testing localStorage:', e);
      }
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startNextServer() {
  if (isDev) {
    nextServer = spawn('npm', ['run', 'dev'], {
      shell: true,
      stdio: 'inherit'
    });

    nextServer.on('error', (err: Error) => {
      console.error('Failed to start Next.js server:', err);
    });
  }
}

// Este método se llamará cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(() => {
  // Configurar la persistencia de la sesión antes de crear la ventana
  const persistentSession = session.fromPartition('persist:glucose');
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Configurar el almacenamiento persistente
  persistentSession.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  // Habilitar cookies persistentes
  persistentSession.cookies.set({
    url: 'http://localhost:3000',
    name: 'test',
    value: 'test',
    secure: true,
    sameSite: 'strict'
  }).then(() => {
    console.log('Cookie test successful');
  }).catch((error) => {
    console.error('Cookie test failed:', error);
  });

  startNextServer();
  createWindow();
});

// Salir cuando todas las ventanas estén cerradas.
app.on('window-all-closed', () => {
  // En macOS es común para las aplicaciones y sus barras de menú
  // que estén activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== 'darwin') {
    if (nextServer) {
      nextServer.kill();
    }
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS es común volver a crear una ventana en la aplicación cuando
  // se hace clic en el icono del dock y no hay otras ventanas abiertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Configuraciones adicionales de seguridad
app.on('web-contents-created', (event, contents) => {
  // Deshabilitar la creación de nuevas ventanas
  contents.setWindowOpenHandler(({ url }) => {
    // Manejar la apertura de URLs externas en el navegador predeterminado
    if (url.startsWith('http:') || url.startsWith('https:')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Deshabilitar la integración con el navegador
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (isDev && parsedUrl.origin === 'http://localhost:3000') {
      return;
    }
    event.preventDefault();
  });
});

app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
}); 