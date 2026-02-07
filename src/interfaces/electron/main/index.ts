import { app, BrowserWindow, ipcMain} from 'electron';
import { Bootstrap } from '@core/Bootstrap';
import { Logger } from '@infra/logging/Logger';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

async function startApp() {
    try {
        // 1. Önce Back-end mantığını başlat
        const system = Bootstrap.getInstance();
        await system.initialize();

        // 2. Sonra Pencereyi aç
        createWindow();
    } catch (error) {
        Logger.error(`Sistem başlatılamadı: ${error}`);
        app.quit();
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: false, // Güvenlik: Kapalı
            contextIsolation: true, // Güvenlik: Açık
            // Preload dosyasının yolunu gösteriyoruz 👇
            preload: path.join(__dirname, '../preload.js') 
        }
    });

    // Şimdilik boş bir HTML yükleyelim veya basit bir string
    if (process.env.npm_lifecycle_event === "dev:main" || process.env.NODE_ENV === "development") {
        console.log("🚧 Development mod: localhost:5173 yükleniyor...");
        // Biraz bekle ki Vite sunucusu ayağa kalksın
        setTimeout(() => {
            mainWindow?.loadURL('http://localhost:5173');
            mainWindow?.webContents.openDevTools(); // Konsolu açar, hata var mı görelim
        }, 1000);
    } else {
        // Production modunda derlenmiş dosyayı yükle
        mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    
    Logger.info('🖥️ Masaüstü arayüzü yüklendi.');
}


ipcMain.on('toMain', (event, data) => {
    console.log("📨 Arayüzden mesaj geldi:", data);

    // Basit bir cevap dönelim
    const reply = `Alındı: "${data}". Ben AI Native, hazırım!`;
    
    // Cevabı geri gönder
    event.sender.send('fromMain', reply);
});



app.whenReady().then(startApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});