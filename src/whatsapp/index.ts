/**
 * BuilderBot con Meta WhatsApp Provider
 */
import { createBot, createProvider, createFlow, MemoryDB } from '@builderbot/bot';
import { MetaProvider } from '@builderbot/provider-meta';
import { welcomeFlow, retryFlow, exitFlow, newLinkFlow } from './flows';
import { whatsappConfig, validateWhatsappConfig } from './config/whatsapp.config';
import { setBotProvider } from './services/WhatsAppService';

export const initWhatsappBot = async (): Promise<void> => {
    // Validar configuración antes de iniciar
    if (!validateWhatsappConfig()) {
        console.warn('⚠️ WhatsApp Bot no iniciado: configuración incompleta');
        return;
    }

    // Crear proveedor de Meta
    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: whatsappConfig.jwtToken,
        numberId: whatsappConfig.numberId,
        verifyToken: whatsappConfig.verifyToken,
        version: whatsappConfig.version,
    });

    // Establecer el provider en el servicio de WhatsApp para poder enviar mensajes
    setBotProvider(adapterProvider);

    // Crear flujo con todos los flows
    const adapterFlow = createFlow([welcomeFlow, retryFlow, exitFlow, newLinkFlow]);

    // Crear el bot
    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: new MemoryDB(),
    });

    // Obtener el puerto del servidor HTTP del bot
    const botPort = parseInt(process.env.BOT_PORT || '3008', 10);

    // Iniciar servidor HTTP del bot en un puerto diferente
    httpServer(botPort);

    console.log(`✅ WhatsApp Bot iniciado en puerto ${botPort}`);
    console.log(`📱 Webhook URL: https://tu-dominio.com/webhook`);
};

export { whatsappConfig } from './config/whatsapp.config';
export { welcomeFlow } from './flows';
