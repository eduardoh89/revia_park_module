import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import * as bwipjs from 'bwip-js';

const logger = new Logger('ReceiptService');

export interface ReceiptData {
  receiptNumber: string;
  licensePlate: string;
  arrivalTime: Date;
  exitTime: Date;
  amount: number;
  transactionCode: string;
  parkingLotName?: string;
}

export class ReceiptService {
  private static RECEIPTS_DIR = path.join(__dirname, '../../../receipts');

  /**
   * Genera una boleta en PDF con código PDF417
   */
  static async generateReceipt(data: ReceiptData): Promise<string> {
    try {
      // Crear directorio de boletas si no existe
      if (!fs.existsSync(this.RECEIPTS_DIR)) {
        fs.mkdirSync(this.RECEIPTS_DIR, { recursive: true });
      }

      const fileName = `boleta_${data.receiptNumber}_${Date.now()}.pdf`;
      const filePath = path.join(this.RECEIPTS_DIR, fileName);

      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'A6', // Tamaño compacto para boleta
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });

      // Guardar en archivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Encabezado
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('REVIA', { align: 'center' })
        .moveDown(0.3);

      doc.fontSize(12)
        .font('Helvetica')
        .text('Sistema de Estacionamiento', { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(10)
        .text('BOLETA DE ESTACIONAMIENTO', { align: 'center' })
        .moveDown(0.2);

      doc.fontSize(9)
        .text(`N° ${data.receiptNumber}`, { align: 'center' })
        .moveDown(1);

      // Línea divisoria
      doc.moveTo(30, doc.y)
        .lineTo(doc.page.width - 30, doc.y)
        .stroke()
        .moveDown(1);

      // Datos del estacionamiento
      const lineHeight = 20;
      let currentY = doc.y;

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Patente:', 30, currentY, { continued: true })
        .font('Helvetica')
        .text(`  ${data.licensePlate.toUpperCase()}`);

      currentY += lineHeight;
      doc.font('Helvetica-Bold')
        .text('Llegada:', 30, currentY, { continued: true })
        .font('Helvetica')
        .text(`  ${this.formatDateTime(data.arrivalTime)}`);

      currentY += lineHeight;
      doc.font('Helvetica-Bold')
        .text('Salida:', 30, currentY, { continued: true })
        .font('Helvetica')
        .text(`  ${this.formatDateTime(data.exitTime)}`);

      currentY += lineHeight;
      const duration = this.calculateDuration(data.arrivalTime, data.exitTime);
      doc.font('Helvetica-Bold')
        .text('Tiempo:', 30, currentY, { continued: true })
        .font('Helvetica')
        .text(`  ${duration}`);

      if (data.parkingLotName) {
        currentY += lineHeight;
        doc.font('Helvetica-Bold')
          .text('Lugar:', 30, currentY, { continued: true })
          .font('Helvetica')
          .text(`  ${data.parkingLotName}`);
      }

      currentY += lineHeight * 1.5;

      // Línea divisoria
      doc.moveTo(30, currentY)
        .lineTo(doc.page.width - 30, currentY)
        .stroke();

      currentY += lineHeight;

      // Monto total
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('TOTAL:', 30, currentY, { continued: true })
        .text(`  $${data.amount.toLocaleString('es-CL')}`, { align: 'left' });

      currentY += lineHeight * 1.5;

      // Código de transacción
      doc.fontSize(9)
        .font('Helvetica')
        .text(`Transacción: ${data.transactionCode}`, 30, currentY, { align: 'center' });

      currentY += lineHeight * 1.5;

      // Generar código PDF417
      const barcodeData = this.generateBarcodeData(data);
      const barcodeImage = await this.generatePDF417(barcodeData);

      if (barcodeImage) {
        // Agregar código PDF417 al documento
        doc.moveDown(1);
        const barcodeWidth = 200;
        const barcodeX = (doc.page.width - barcodeWidth) / 2;

        doc.image(barcodeImage, barcodeX, doc.y, {
          width: barcodeWidth,
          align: 'center'
        });
      }

      doc.moveDown(2);

      // Pie de página
      doc.fontSize(8)
        .font('Helvetica')
        .text('Gracias por usar REVIA', { align: 'center' })
        .moveDown(0.3)
        .text(`Fecha de emisión: ${this.formatDateTime(new Date())}`, { align: 'center' });

      // Finalizar documento
      doc.end();

      // Esperar a que termine de escribirse
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      logger.info('Receipt generated successfully', {
        fileName,
        licensePlate: data.licensePlate
      });

      return filePath;
    } catch (error) {
      logger.error('Error generating receipt', { error, data });
      throw error;
    }
  }

  /**
   * Genera los datos para el código PDF417
   */
  private static generateBarcodeData(data: ReceiptData): string {
    return [
      `REVIA`,
      `BOLETA:${data.receiptNumber}`,
      `PATENTE:${data.licensePlate.toUpperCase()}`,
      `LLEGADA:${data.arrivalTime.toISOString()}`,
      `SALIDA:${data.exitTime.toISOString()}`,
      `MONTO:${data.amount}`,
      `TRANSACCION:${data.transactionCode}`,
    ].join('|');
  }

  /**
   * Genera imagen del código PDF417
   */
  private static async generatePDF417(data: string): Promise<Buffer | null> {
    try {
      // Generar código PDF417 usando bwip-js
      const png = await bwipjs.toBuffer({
        bcid: 'pdf417',        // Tipo de código de barras
        text: data,            // Datos a codificar
        scale: 3,              // Escala de la imagen
        height: 10,            // Altura en milímetros
        columns: 6,            // Número de columnas de datos
      } as any);

      return png as Buffer;
    } catch (error) {
      logger.error('Error generating PDF417 barcode', { error });
      return null;
    }
  }

  /**
   * Formatea fecha y hora
   */
  private static formatDateTime(date: Date): string {
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Calcula la duración entre dos fechas
   */
  private static calculateDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  /**
   * Elimina un archivo de boleta
   */
  static async deleteReceipt(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('Receipt deleted', { filePath });
      }
    } catch (error) {
      logger.error('Error deleting receipt', { error, filePath });
    }
  }
}
