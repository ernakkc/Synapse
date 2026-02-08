import { logger } from '../src/infrastructure/logging/Logger';

// Logger'ı test etmek için basit bir örnek
logger.info('Bu bir bilgi mesajıdır');
logger.warn('Bu bir uyarı mesajıdır');
logger.error('Bu bir hata mesajıdır', new Error('Örnek hata'));

// Performans ölçümü örneği
const timer = logger.time('Performans Testi');
setTimeout(() => {
  timer.end();
}, 2000);

// Özel metodlar
logger.success('Bu bir başarı mesajıdır');
logger.start('Bu bir başlangıç mesajıdır');
logger.complete('Bu bir tamamlanma mesajıdır');

