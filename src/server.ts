import 'dotenv/config';
import { App } from './app';
import { Logger } from './shared/utils/logger';

const logger = new Logger('Server');
const app = new App();
const port = parseInt(process.env.PORT || '3000', 10);

// Iniciar servidor
import 'reflect-metadata'; // TypeORM requirement
import { AppDataSource } from './data-source';

// Iniciar servidor
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connected successfully');

    const server = app.getApp().listen(port, () => {
      console.log(`
    ╔════════════════════════════════════════════════════╗
    ║           REVIA BACKEND - SERVIDOR ACTIVO          ║
    ╚════════════════════════════════════════════════════╝
    
    🚀 Servidor iniciado exitosamente
    
    📍 Environment: ${process.env.NODE_ENV || 'development'}
    🌐 Server URL:  http://localhost:${port}
    📝 API Version: v1
    
    🔧 Servicios:
       ✅ Express Server: Activo
       ✅ Database:       Conectada (MySQL)
       ✅ Klap Payment:   Configurado (${process.env.KLAP_ENVIRONMENT || 'sandbox'})
    
    📊 Endpoints disponibles:
       • GET  /health                       - Health check
       • POST /api/v1/payments/create       - Crear pago
       • POST /api/v1/webhooks/klap/...     - Webhooks Klap
       • POST /api/v1/vehicles/entry        - Entrada vehículo
    
    4. Prueba creando un pago: POST /api/v1/payments/create
    
    ════════════════════════════════════════════════════
    
    Presiona Ctrl+C para detener el servidor
      `);

      logger.info(`Server started on port ${port}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, closing server...`);
      server.close(async () => {
        await AppDataSource.destroy();
        logger.info('Database disconnected');
        logger.info('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  })
  .catch((error) => {
    logger.error('Failed to connect to database', { error });
    process.exit(1);
  });
