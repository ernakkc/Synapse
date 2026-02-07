import { contextBridge, ipcRenderer } from 'electron';

// Arayüze (React) açılacak API
const api = {
  // Mesaj gönderme (UI -> Main)
  sendMessage: (channel: string, data: any) => {
    // Sadece belirli kanallara izin ver (Güvenlik)
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Cevap dinleme (Main -> UI)
  onResponse: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Eski dinleyicileri temizle ki hafıza şişmesin
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
};

// "window.api" olarak arayüze sun
contextBridge.exposeInMainWorld('api', api);