# Synapse Architecture & Structure
Bu belge, Synapse projesinin mimari yapısını ve klasör organizasyonunu detaylandırır. Proje, temiz mimari prensiplerine uygun olarak katmanlı bir yapıya sahiptir. Her katman, belirli sorumluluklara sahip modüller içerir ve bu modüller birbirleriyle net bir şekilde ayrılmıştır.

### 📁 Ana Klasörler
- **.github** - CI/CD workflows
- **.vscode** - Debug ve editor ayarları
- **config** - Konfigürasyon dosyaları
- **docs** - Mimari dokümantasyon
- **scripts** - Build ve deploy scriptleri
- **tests** - Birim, entegrasyon ve E2E testler

### 🧠 Core Layer (Domain)
- entities - User, Message modelleri
- repositories - Interface'ler
- services - BrainService, ContextService
- events - Domain events

### 🏗️ Infrastructure Layer
- providers - OpenAI, Anthropic, Ollama adaptörleri
- database - SQLite implementasyonu + migrations
- memory - Vector store (RAG)
- bus - Event bus
- logging - Logger

### 🧩 Modules Layer
- automation - Web otomasyonu
- system - OS kontrolü
- media - Görsel/video işleme
- coding - Kod yetenekleri

### 🖥️ Interfaces Layer
- telegram - Telegram bot
- electron - Desktop uygulama
- cli - Komut satırı

### 🛠️ Shared Utilities
- constants - Sabitler
- utils - Date, String utilities
- errors - Custom error sınıfları