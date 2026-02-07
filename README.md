# 🧠 Synapse - AI Native Enterprise Architecture

> Modern, ölçeklenebilir ve framework-bağımsız AI asistan platformu

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Mimari Prensipler](#-mimari-prensipler)
- [Klasör Yapısı](#-klasör-yapısı)
- [Kurulum](#-kurulum)
- [Geliştirme](#-geliştirme)
- [Test](#-test)
- [Deployment](#-deployment)
- [Katkıda Bulunma](#-katkıda-bulunma)

## 🎯 Genel Bakış

Synapse, Enterprise Architecture prensiplerine uygun olarak tasarlanmış, çoklu arayüz destekli (Telegram, Electron, CLI) bir AI asistan platformudur.

### Temel Özellikler

- 🏗️ **Clean Architecture**: İş mantığı ve altyapı katmanları kesin çizgilerle ayrılmıştır
- 🔌 **Pluggable Design**: AI sağlayıcıları (OpenAI, Anthropic, Ollama) kolayca değiştirilebilir
- 🧩 **Modular**: Yeni yetenekler bağımsız modüller olarak eklenebilir
- 🔄 **Event-Driven**: Loose coupling için event bus mimarisi
- 🧪 **Test Edilebilir**: Her katman bağımsız olarak test edilebilir
- 📦 **Type-Safe**: End-to-end TypeScript desteği

## 🏛️ Mimari Prensipler

### 1. Katman Ayrımı (Separation of Concerns)

```
┌─────────────────────────────────────────┐
│     INTERFACES (Telegram, Electron)     │  ← Kullanıcı Etkileşimi
├─────────────────────────────────────────┤
│     CORE (Entities, Services)           │  ← İş Mantığı (Framework Bağımsız)
├─────────────────────────────────────────┤
│     INFRASTRUCTURE (DB, AI, Logging)    │  ← Teknik Detaylar
└─────────────────────────────────────────┘
```

### 2. Dependency Rule

**Bağımlılık yönü her zaman içe doğrudur:**

- Infrastructure → Core'a bağımlıdır
- Interfaces → Core'a bağımlıdır
- Core → Hiçbir şeye bağımlı değildir (Saf iş mantığı)

### 3. Inversion of Control

`core` katmanı interface'ler tanımlar, `infrastructure` katmanı bu interface'leri implement eder. Böylece iş mantığı teknik detaylardan bağımsız kalır.

## 📁 Klasör Yapısı

```
synapse/
├── .github/                    # CI/CD Workflows
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .vscode/                    # VS Code Ayarları
│   ├── launch.json             # Debug konfigürasyonları
│   └── settings.json
│
├── config/                     # Konfigürasyon Dosyaları
│   ├── default.json
│   ├── development.json
│   └── production.json
│
├── docs/                       # Dokümantasyon
│   ├── architecture.md         # Mimari detayları
│   ├── api.md                  # API dokümantasyonu
│   └── diagrams/               # Mimari diyagramlar
│
├── scripts/                    # Build ve Deploy Scriptleri
│   ├── build.sh
│   ├── deploy.sh
│   └── db-migrate.sh
│
├── src/
│   ├── @types/                 # Global Type Tanımları
│   │   └── global.d.ts
│   │
│   ├── core/                   # 🧠 DOMAIN LAYER
│   │   ├── entities/           # Domain Modelleri
│   │   │   ├── User.ts
│   │   │   ├── Message.ts
│   │   │   ├── Task.ts
│   │   │   └── Context.ts
│   │   │
│   │   ├── repositories/       # Data Access Interfaces
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IMessageRepository.ts
│   │   │   └── ITaskRepository.ts
│   │   │
│   │   ├── services/           # Business Logic Services
│   │   │   ├── BrainService.ts      # Ana karar mekanizması
│   │   │   ├── ContextService.ts    # Bağlam yönetimi
│   │   │   ├── PlannerService.ts    # Aksiyon planlama
│   │   │   └── MemoryService.ts     # Uzun dönem hafıza
│   │   │
│   │   └── events/             # Domain Events
│   │       ├── MessageReceivedEvent.ts
│   │       ├── TaskCompletedEvent.ts
│   │       └── EventTypes.ts
│   │
│   ├── infrastructure/         # 🏗️ INFRASTRUCTURE LAYER
│   │   ├── ai/                 # LLM Sağlayıcıları
│   │   │   ├── providers/
│   │   │   │   ├── ILLMProvider.ts
│   │   │   │   ├── OpenAIProvider.ts
│   │   │   │   ├── AnthropicProvider.ts
│   │   │   │   └── OllamaProvider.ts
│   │   │   └── PromptManager.ts
│   │   │
│   │   ├── database/           # Database Implementasyonları
│   │   │   ├── sqlite/
│   │   │   │   ├── SqliteUserRepository.ts
│   │   │   │   ├── SqliteMessageRepository.ts
│   │   │   │   └── connection.ts
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql
│   │   │
│   │   ├── memory/             # Vector Database (RAG)
│   │   │   ├── VectorStore.ts
│   │   │   └── EmbeddingService.ts
│   │   │
│   │   ├── bus/                # Event Bus
│   │   │   ├── EventBus.ts
│   │   │   └── EventEmitterBus.ts
│   │   │
│   │   └── logging/            # Logging
│   │       ├── Logger.ts
│   │       └── WinstonLogger.ts
│   │
│   ├── modules/                # 🧩 CAPABILITY MODULES
│   │   ├── automation/         # Web Automation
│   │   │   ├── BrowserService.ts
│   │   │   ├── ScraperService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── system/             # System Control
│   │   │   ├── CommandRunner.ts
│   │   │   ├── FileSystemService.ts
│   │   │   └── ProcessManager.ts
│   │   │
│   │   ├── media/              # Media Processing
│   │   │   ├── ImageService.ts
│   │   │   ├── VideoService.ts
│   │   │   └── AudioService.ts
│   │   │
│   │   └── coding/             # Code Capabilities
│   │       ├── CodeAnalyzer.ts
│   │       ├── CodeGenerator.ts
│   │       └── RefactorService.ts
│   │
│   ├── interfaces/             # 🖥️ PRESENTATION LAYER
│   │   ├── telegram/           # Telegram Bot
│   │   │   ├── commands/
│   │   │   │   ├── StartCommand.ts
│   │   │   │   ├── HelpCommand.ts
│   │   │   │   └── index.ts
│   │   │   ├── handlers/
│   │   │   │   ├── TextMessageHandler.ts
│   │   │   │   ├── CallbackHandler.ts
│   │   │   │   └── index.ts
│   │   │   └── bot.ts
│   │   │
│   │   ├── electron/           # Desktop Application
│   │   │   ├── main/           # Main Process
│   │   │   │   ├── index.ts
│   │   │   │   ├── ipc-handlers.ts
│   │   │   │   └── window-manager.ts
│   │   │   │
│   │   │   ├── preload/        # Context Bridge
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── renderer/       # UI Layer
│   │   │       ├── components/
│   │   │       │   ├── Chat.tsx
│   │   │       │   ├── TaskList.tsx
│   │   │       │   └── Settings.tsx
│   │   │       ├── hooks/
│   │   │       │   ├── useChat.ts
│   │   │       │   └── useTasks.ts
│   │   │       ├── store/
│   │   │       │   └── index.ts
│   │   │       └── index.tsx
│   │   │
│   │   └── cli/                # Command Line Interface
│   │       ├── index.ts
│   │       └── commands/
│   │
│   └── shared/                 # 🛠️ SHARED UTILITIES
│       ├── constants/
│       │   └── index.ts
│       ├── utils/
│       │   ├── date.ts
│       │   ├── string.ts
│       │   └── validation.ts
│       └── errors/
│           ├── AppError.ts
│           ├── NotFoundError.ts
│           └── ValidationError.ts
│
├── tests/                      # Testler
│   ├── unit/                   # Birim Testleri
│   │   ├── core/
│   │   └── modules/
│   ├── integration/            # Entegrasyon Testleri
│   │   └── api/
│   └── e2e/                    # End-to-End Testler
│       └── telegram/
│
├── .env.example                # Örnek Environment Variables
├── .gitignore
├── package.json
├── tsconfig.json               # Base TypeScript Config
├── tsconfig.build.json         # Production Build Config
└── turbo.json                  # Monorepo Build Tool (Optional)
```

## 🚀 Kurulum

### Gereksinimler

- Node.js >= 18.x
- pnpm >= 8.x (veya npm/yarn)
- SQLite3
- Git

### Adımlar

```bash
# Repoyu klonlayın
git clone <repo-url> synapse
cd synapse

# Bağımlılıkları yükleyin
pnpm install

# Environment dosyasını oluşturun
cp .env.example .env

# Environment değişkenlerini düzenleyin
nano .env

# Veritabanını oluşturun
pnpm db:migrate

# Development modunda başlatın
pnpm dev
```

### Environment Variables

`.env` dosyasında aşağıdaki değişkenleri ayarlayın:

```env
# Application
NODE_ENV=development
PORT=3000

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Database
DATABASE_PATH=./data/synapse.db

# Logging
LOG_LEVEL=info
```

## 💻 Geliştirme

### Path Aliases

TypeScript path alias'ları kullanarak temiz import'lar yapabilirsiniz:

```typescript
// ❌ Kötü
import { BrainService } from "../../../../core/services/BrainService";

// ✅ İyi
import { BrainService } from "@core/services/BrainService";
```

### Dependency Injection

Projede manuel DI pattern kullanılmaktadır. Gelecekte `InversifyJS` veya `TSyringe` eklenebilir.

```typescript
// Container örneği
class Container {
  private brainService: BrainService;

  constructor() {
    const llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
    const contextService = new ContextService();
    this.brainService = new BrainService(llmProvider, contextService);
  }

  getBrainService(): BrainService {
    return this.brainService;
  }
}
```

### Yeni Modül Ekleme

1. `src/modules/` altında yeni klasör oluşturun
2. Modülün ihtiyaç duyduğu entity ve service'leri `core` katmanına ekleyin
3. Modül içinde implementation'ı yazın
4. Interface'lere entegre edin

```bash
# Örnek: SMS gönderme modülü
src/modules/sms/
├── SmsService.ts
├── providers/
│   ├── TwilioProvider.ts
│   └── ISmsProvider.ts
└── types.ts
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
pnpm test

# Unit testler
pnpm test:unit

# Integration testler
pnpm test:integration

# E2E testler
pnpm test:e2e

# Coverage raporu
pnpm test:coverage
```

### Test Yazma Örneği

```typescript
// tests/unit/core/services/BrainService.test.ts
import { describe, it, expect, vi } from "vitest";
import { BrainService } from "@core/services/BrainService";
import { MockLLMProvider } from "@tests/mocks/MockLLMProvider";

describe("BrainService", () => {
  it("should process user message correctly", async () => {
    const mockProvider = new MockLLMProvider();
    const brainService = new BrainService(mockProvider);

    const result = await brainService.processMessage("Hello");

    expect(result).toBeDefined();
    expect(mockProvider.generate).toHaveBeenCalledOnce();
  });
});
```

## 📦 Build ve Deployment

### Production Build

```bash
# Build
pnpm build

# Preview
pnpm start:prod
```

### Docker

```bash
# Docker image oluştur
docker build -t synapse:latest .

# Container çalıştır
docker run -d \
  --name synapse \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  synapse:latest
```

### Electron Application

```bash
# Electron uygulama paketleme
pnpm build:electron

# Platform spesifik build
pnpm build:electron:mac
pnpm build:electron:win
pnpm build:electron:linux
```

## 🔧 Kullanılan Teknolojiler

### Core

- **TypeScript** - Type safety
- **Node.js** - Runtime

### Infrastructure

- **Better-SQLite3** - Embedded database
- **Winston** - Logging
- **Node EventEmitter** - Event bus

### AI & ML

- **OpenAI SDK** - GPT modelleri
- **Anthropic SDK** - Claude modelleri
- **Ollama** - Local LLM'ler

### Interfaces

- **Telegraf** - Telegram bot framework
- **Electron** - Desktop application
- **React** - UI framework (Electron renderer)

### Modules

- **Playwright** - Web automation
- **Sharp** - Image processing
- **FFmpeg** - Video/audio processing

### Development

- **Vitest** - Testing framework
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Conventions

Conventional Commits standardı kullanılmaktadır:

```
feat: Yeni özellik
fix: Bug düzeltmesi
docs: Dokümantasyon değişikliği
style: Code style değişikliği
refactor: Refactoring
test: Test ekleme/düzeltme
chore: Build, config değişiklikleri
```

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **GitHub**: [Your GitHub](https://github.com/yourusername)
- **Email**: your.email@example.com
- **Discord**: Your Community

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak projelerden ilham almıştır:

- Clean Architecture (Robert C. Martin)
- Domain-Driven Design (Eric Evans)
- Hexagonal Architecture (Alistair Cockburn)

---

**Synapse ile geleceğin AI asistanını bugün inşa edin! 🚀**
