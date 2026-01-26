/**
 * Configuración de Meta WhatsApp API para BuilderBot
 */
import 'dotenv/config';

export const whatsappConfig = {
    // Token de verificación del webhook
    jwtToken: process.env.META_JWT_TOKEN || '',
    // Token de acceso de la API de WhatsApp
    numberId: process.env.META_NUMBER_ID || '',
    // Token de acceso de la API de Graph
    verifyToken: process.env.META_VERIFY_TOKEN || '',
    // Versión de la API de Graph
    version: process.env.META_VERSION || 'v18.0',
};

// Validar configuración
export const validateWhatsappConfig = (): boolean => {    
    const requiredVars = ['jwtToken', 'numberId', 'verifyToken'];
    const missing = requiredVars.filter(
        (key) => !whatsappConfig[key as keyof typeof whatsappConfig]
    );

    if (missing.length > 0) {
        console.warn(
            `⚠️ Faltan variables de entorno para WhatsApp: ${missing.join(', ')}`
        );
        return false;
    }
    return true;
};
