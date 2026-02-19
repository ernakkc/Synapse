# 🧠 Synapse - AI Native Enterprise Architecture

> Modern, ölçeklenebilir ve framework-bağımsız AI asistan platformu

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Mimari Prensipler](#-mimari-prensipler)
- [Klasör Yapısı](#-klasör-yapısı)
- [Core Systems Architecture](#-core-systems-architecture)
- [Kurulum](#-kurulum)
- [Geliştirme](#-geliştirme)
- [Usage Examples](#-usage-examples)
- [Test](#-test)
- [Deployment](#-deployment)
- [Kullanılan Teknolojiler](#-kullanılan-teknolojiler)
- [Key Features Summary](#-key-features-summary)
- [Katkıda Bulunma](#-katkıda-bulunma)

## 🎯 Genel Bakış

Synapse, Enterprise Architecture prensiplerine uygun olarak tasarlanmış, çoklu arayüz destekli (Telegram, Electron, CLI) bir AI asistan platformudur.

**Proje Durumu**: 🚧 Aktif Geliştirme Aşamasında

Synapse, kullanıcıların doğal dil komutlarıyla sistem işlemleri yapabilmesini sağlayan, AI destekli bir otomasyon platformudur. Kullanıcı mesajlarını analiz eder, niyeti belirler, gerekli aksiyonları planlar ve terminal komutlarını otomatik olarak üretip çalıştırır.

**Aktif Özellikler**:
- ✅ MessageAnalyzer - Intent detection & NLP
- ✅ ActionPlanner - Task planning
- ✅ ChatInteraction - Conversational responses
- ✅ SystemInteraction - AI-powered command execution
- ✅ CommandRunner - Advanced terminal management
- ✅ Multi-provider AI support (Ollama, OpenAI, Anthropic)

**Planlanan Özellikler**:
- 🔜 Telegram Bot interface
- 🔜 Electron Desktop Application
- 🔜 Web automation capabilities
- 🔜 Memory & context persistence
- 🔜 Multi-user support

### Temel Özellikler

- 🏗️ **Clean Architecture**: İş mantığı ve altyapı katmanları kesin çizgilerle ayrılmıştır
- 🔌 **Pluggable Design**: AI sağlayıcıları (OpenAI, Anthropic, Ollama) kolayca değiştirilebilir
- 🧩 **Modular**: Yeni yetenekler bağımsız modüller olarak eklenebilir
- 🔄 **Event-Driven**: Loose coupling için event bus mimarisi
- 🧪 **Test Edilebilir**: Her katman bağımsız olarak test edilebilir
- 📦 **Type-Safe**: End-to-end TypeScript desteği
- 🖥️ **Advanced Command Execution**: Persistent terminal sessions ile güçlü komut çalıştırma
- 🤖 **AI-Powered Commands**: LLM ile otomatik komut üretimi ve execution
- 🎯 **Smart Message Analysis**: Gelişmiş intent detection ve context-aware responses

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
│   │   │   ├── BrainService.ts           # Ana karar mekanizması
│   │   │   ├── analyzer/                 # Message Analysis
│   │   │   │   ├── MessageAnalyzer.ts    # Intent detection & context extraction
│   │   │   │   ├── MessageAnalyzerPrompt.ts
│   │   │   │   └── index.ts
│   │   │   ├── planner/                  # Action Planning
│   │   │   │   ├── ActionPlanner.ts      # High-level action planning
│   │   │   │   ├── ActionPlannerPrompt.ts
│   │   │   │   └── index.ts
│   │   │   └── executor/                 # Action Execution
│   │   │       ├── chat_interaction/     # Chat responses
│   │   │       │   ├── ChatInteraction.ts
│   │   │       │   ├── ChatInteractionPrompt.ts
│   │   │       │   └── index.ts
│   │   │       └── system_interaction/   # System command execution
│   │   │           ├── SystemInteraction.ts      # AI-powered command execution
│   │   │           ├── SystemInteractionPrompt.ts # Comprehensive command generation
│   │   │           └── index.ts
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
│   │   │   └── runCommand.ts        # Advanced command execution system
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

## 🧠 Core Systems Architecture

### Message Processing Pipeline

```
User Input
    ↓
MessageAnalyzer (Intent Detection)
    ↓
ActionPlanner (High-level Planning)
    ↓
Executor (Chat or System Interaction)
    ↓
Response to User
```

### 1. MessageAnalyzer

**Görev**: Kullanıcı mesajını analiz eder, intent'i belirler ve context'i çıkarır.

```typescript
// Intent types: CHAT, OTHERS, UNKNOWN
// Extracts: user_text, language, entities
const analysis = await messageAnalyzer.analyze(userMessage);
```

**Özellikler**:
- Multi-language support
- Context extraction
- Entity recognition
- Intent classification

### 2. ActionPlanner

**Görev**: Analiz sonucuna göre yapılması gereken aksiyonları planlar.

```typescript
// Plans high-level steps
const plan = await actionPlanner.plan(analysisResult);
```

**Özellikler**:
- Step-by-step planning
- Resource requirement detection
- Dependency management

### 3. Executors

#### ChatInteraction

Sohbet tipi mesajlar için doğal yanıtlar üretir:

```typescript
const response = await chatInteraction(analysisResult);
```

#### SystemInteraction

Sistem komutlarını AI ile üretir ve çalıştırır:

```typescript
const service = new SystemInteractionService();

// 1. Generate commands via AI
const commands = await service.generateCommands(analysis, plan);

// 2. Execute commands with detailed logging
const summary = await service.executeCommands(commands.commands);

// 3. Cleanup
await service.cleanup();
```

**SystemInteraction Özellikleri**:
- 🤖 **AI-Powered Command Generation**: LLM ile akıllı komut üretimi
- 🖥️ **Persistent Terminal Sessions**: Komutlar aynı session'da çalışır
- 📊 **Detailed Logging**: Her komut için progress ve result tracking
- ⚡ **Sequential Execution**: Komutlar sırayla güvenli şekilde çalıştırılır
- 🛡️ **Error Handling**: Robust error handling ve continuation
- 📝 **Execution Summary**: Okunabilir formatted summary
- 🔄 **Session Management**: Otomatik session creation ve cleanup
- 🌍 **Cross-Platform**: Windows, macOS, Linux desteği

### 4. CommandRunner System

**Location**: `src/modules/system/runCommand.ts`

Güçlü ve esnek terminal komut çalıştırma sistemi:

```typescript
const runner = new CommandRunner();

// Simple command
const result = await runner.run('echo "Hello"');

// Terminal session (persistent)
const session = await runner.createSession('my-session');
await runner.runInSession('my-session', 'cd /tmp');
await runner.runInSession('my-session', 'pwd');
await runner.closeSession('my-session');

// Sequential commands
await runner.runSequence(['cmd1', 'cmd2', 'cmd3']);

// Parallel commands
await runner.runParallel(['cmd1', 'cmd2', 'cmd3']);
```

**CommandRunner Özellikleri**:
- ✅ Simple & persistent command execution
- ✅ Sequential & parallel execution modes
- ✅ Retry logic with configurable delays
- ✅ Timeout management
- ✅ Command history tracking
- ✅ Output/Error buffering
- ✅ System information utilities
- ✅ Command existence checking

**Detaylar için**: [System Module README](src/modules/system/README.md)

## 🚀 Kurulum

### Gereksinimler

- Node.js >= 18.x
- pnpm >= 8.x (veya npm/yarn)
- SQLite3
- Git

### Adımlar

```bash
# Repoyu klonlayın
git clone https://github.com/ernakkc/synapse.git
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

## 💡 Usage Examples

### Example 1: Basic Command Execution

```typescript
import { CommandRunner } from './modules/system';

const runner = new CommandRunner();

// Execute a simple command
const result = await runner.run('ls -la');
console.log(result.stdout);

// Check if command exists
const hasGit = await runner.commandExists('git');
console.log('Git available:', hasGit);
```

### Example 2: System Interaction with AI

```typescript
import { SystemInteractionService } from './core/services/executor/system_interaction';

const service = new SystemInteractionService();

// User says: "Create a Python script to print fibonacci numbers"
const analysisResult = await messageAnalyzer.analyze(userMessage);
const planningResult = await actionPlanner.plan(analysisResult);

// AI generates commands
const commands = await service.generateCommands(analysisResult, planningResult);
// Result: Commands to create script, execute it, etc.

// Execute commands with detailed logging
const summary = await service.executeCommands(commands.commands);
console.log(summary);

// Always cleanup
await service.cleanup();
```

### Example 3: Terminal Session

```typescript
const runner = new CommandRunner();

// Create persistent session
const session = await runner.createSession('dev-session');

// Execute multiple commands in same session
await runner.runInSession('dev-session', 'cd ~/Desktop');
await runner.runInSession('dev-session', 'mkdir my-project');
await runner.runInSession('dev-session', 'cd my-project');
await runner.runInSession('dev-session', 'npm init -y');

// Close session
await runner.closeSession('dev-session');
```

### Example 4: Parallel Operations

```typescript
const runner = new CommandRunner();

const commands = [
    'curl -s https://api.github.com',
    'curl -s https://api.npmjs.org',
    'curl -s https://registry.npmjs.org'
];

// Execute all commands in parallel
const results = await runner.runParallel(commands);

results.forEach((result, index) => {
    console.log(`Command ${index + 1}:`, result.success ? '✅' : '❌');
});
```

### Example 5: Error Handling & Retry

```typescript
const runner = new CommandRunner();

// Retry failed commands
const result = await runner.runWithRetry('curl https://unreliable-api.com', {
    maxRetries: 3,
    retryDelay: 1000
});

if (!result.success) {
    console.error('Failed after 3 retries:', result.stderr);
}
```

### Example 6: Full Pipeline

```typescript
// Complete flow from user message to execution
async function processUserRequest(userMessage: string) {
    // 1. Analyze intent
    const analysis = await messageAnalyzer.analyze(userMessage);
    
    if (analysis.intent === 'CHAT') {
        // Simple chat response
        return await chatInteraction(analysis);
    }
    
    // 2. Plan actions
    const plan = await actionPlanner.plan(analysis);
    
    // 3. Execute system commands
    const service = new SystemInteractionService();
    try {
        const commands = await service.generateCommands(analysis, plan);
        const summary = await service.executeCommands(commands.commands);
        return summary;
    } finally {
        await service.cleanup();
    }
}

// Usage
const response = await processUserRequest("Create a backup of my database");
console.log(response);
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
- **Child Process** - System command execution
- **Spawn/Exec** - Terminal process management

### AI & ML

- **OpenAI SDK** - GPT modelleri
- **Anthropic SDK** - Claude modelleri
- **Ollama** - Local LLM'ler
- **Custom Prompts** - Advanced prompt engineering
- **Context Management** - Multi-turn conversations

### Interfaces

- **Telegraf** - Telegram bot framework
- **Electron** - Desktop application
- **React** - UI framework (Electron renderer)

### Modules

- **CommandRunner** - Advanced terminal command execution
- **SystemInteraction** - AI-powered command generation
- **MessageAnalyzer** - Intent detection & NLP
- **ActionPlanner** - Task planning & orchestration
- **Playwright** - Web automation (planned)
- **Sharp** - Image processing (planned)
- **FFmpeg** - Video/audio processing (planned)

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

## 🎯 Key Features Summary

### Message Processing
- ✅ **Intent Detection** - Natural language understanding
- ✅ **Context Extraction** - Entity recognition
- ✅ **Multi-language Support** - Turkish, English, and more
- ✅ **Chat Interaction** - Natural conversational responses

### Command Execution
- ✅ **AI Command Generation** - Automatic command creation from intent
- ✅ **Persistent Sessions** - Terminal sessions with state
- ✅ **Sequential Execution** - Commands run in order with dependency handling
- ✅ **Parallel Execution** - Multiple commands simultaneously
- ✅ **Error Handling** - Robust error recovery and continuation
- ✅ **Retry Logic** - Automatic retry with configurable delays
- ✅ **Timeout Management** - Per-command timeout controls
- ✅ **Detailed Logging** - Real-time progress tracking
- ✅ **Execution Summary** - Formatted, readable reports

### System Integration
- ✅ **Cross-Platform** - Windows, macOS, Linux support
- ✅ **Command History** - Track all executed commands
- ✅ **Session Management** - Create, manage, and cleanup sessions
- ✅ **System Info** - Platform, resources, environment detection
- ✅ **Command Validation** - Check command existence before execution

### Development
- ✅ **TypeScript** - Full type safety
- ✅ **Clean Architecture** - Separation of concerns
- ✅ **Modular Design** - Pluggable components
- ✅ **Testable** - Unit, integration, e2e tests
- ✅ **Well Documented** - Comprehensive docs and examples

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **GitHub**: [Eren Akkoç](https://github.com/ernakkc)
- **Email**: ern.akkc@gmail.com
- **Website**: [https://erenakkoc.com](https://erenakkoc.com)

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak projelerden ilham almıştır:

- Clean Architecture (Robert C. Martin)
- Domain-Driven Design (Eric Evans)
- Hexagonal Architecture (Alistair Cockburn)

---

**Synapse ile geleceğin AI asistanını bugün inşa edin! 🚀**
