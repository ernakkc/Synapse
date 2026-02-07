import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

declare global {
  interface Window {
    api: {
      sendMessage: (channel: string, message: string) => void;
    };
  }
}

const App = () => {
  const [messages, setMessages] = useState<string[]>([]);

  // Test için basit bir useEffect
  useEffect(() => {
    console.log("React bileşeni yüklendi!");
  }, []);

  const sendPing = () => {
    const msg = "Merhaba Dünya!";
    setMessages(prev => [...prev, `👤 Sen: ${msg}`]);
    // @ts-ignore
    if (window.api) {
        window.api.sendMessage('toMain', msg);
    } else {
        console.error("API bulunamadı!");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', backgroundColor: '#f0f0f0', height: '100vh' }}>
      <h1>AI Native Panel</h1>
      
      {/* BUTON BURADA 👇 */}
      <button 
        onClick={sendPing} 
        style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer' 
        }}>
        Mesaj Gönder
      </button>
      
      <div style={{ marginTop: 20, border: '1px solid #ccc', padding: 10, background: 'white' }}>
        {messages.map((m, i) => <div key={i}>{m}</div>)}
      </div>
    </div>
  );
};

// HTML'deki "root" id'li div'i bul ve içine App'i çiz
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<App />);
} else {
    console.error("Root elementi bulunamadı! HTML dosyasını kontrol et.");
}