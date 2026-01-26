import { Logger } from '../../shared/utils/logger';
import * as fs from 'fs';

const logger = new Logger('WhatsAppService');

// Esta referencia se establecerá cuando el bot se inicialice
let botProvider: any = null;

/**
 * Establece la referencia al provider del bot de WhatsApp
 * Debe ser llamado durante la inicialización del bot
 */
export function setBotProvider(provider: any) {
  botProvider = provider;
  logger.info('WhatsApp bot provider configured');
}

/**
 * Envía un mensaje de WhatsApp a un número específico
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    if (!botProvider) {
      logger.error('Bot provider not initialized. Call setBotProvider first.');
      return false;
    }

    // Enviar mensaje usando el provider del bot
    await botProvider.sendMessage(phoneNumber, message, {});

    logger.info('WhatsApp message sent successfully', {
      phoneNumber,
      messageLength: message.length,
    });

    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp message', {
      phoneNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Envía un archivo PDF por WhatsApp
 */
export async function sendWhatsAppFile(
  phoneNumber: string,
  filePath: string,
  caption?: string
): Promise<boolean> {
  try {
    if (!botProvider) {
      logger.error('Bot provider not initialized. Call setBotProvider first.');
      return false;
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      logger.error('File not found', { filePath });
      return false;
    }

    // Enviar archivo usando el provider del bot
    // Usamos sendFile que acepta rutas locales directamente
    if (typeof botProvider.sendFile === 'function') {
      await botProvider.sendFile(phoneNumber, filePath, caption);
    } else {
      // Fallback: enviar como mensaje con la ruta
      // Nota: Esto puede requerir que el archivo esté disponible públicamente
      logger.warn('sendFile not available, trying sendMedia with file path');
      await botProvider.sendMedia(phoneNumber, filePath, caption);
    }

    logger.info('WhatsApp file sent successfully', {
      phoneNumber,
      filePath,
      caption,
    });

    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp file', {
      phoneNumber,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
