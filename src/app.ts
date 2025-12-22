import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './api/middlewares/errorHandler';
import routes from './api/routes';
import { Logger } from './shared/utils/logger';
import { engine } from 'express-handlebars';
import * as path from 'path';


const logger = new Logger('App');

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeViewEngine();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeViewEngine(): void {
    // Configurar Handlebars
    this.app.engine(
      'hbs',
      engine({
        extname: '.hbs',
        defaultLayout: 'main',
        layoutsDir: path.join(__dirname, '../views/layouts'),
        partialsDir: path.join(__dirname, '../views/partials'),
        helpers: {
          // Helper para comparación (usado en result.hbs)
          eq: (a: any, b: any) => a === b,
        },
      })
    );
    this.app.set('view engine', 'hbs');
    this.app.set('views', path.join(__dirname, '../views'));

    // Archivos estáticos
    ///  this.app.use(express.static(path.join(__dirname, '../public')));

    logger.info('View engine (Handlebars) initialized');
  }



  private initializeMiddlewares(): void {
    // Security - Configuración de Helmet con CSP personalizada para Klap
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
              'https://cdn.jsdelivr.net', // 🧪 Test - Lodash CDN
              'https://h.online-metrix.net', // Sistema antifraude ThreatMetrix
              'https://pay.google.com', // Google Pay SDK
              "'unsafe-inline'", // Necesario para algunos scripts inline de Klap
            ],
            'style-src': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
              "'unsafe-inline'", // Necesario para estilos inline de Klap
            ],
            'img-src': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
              'https://*.google.com',
              'https://*.gstatic.com',
              'data:', // Para imágenes en base64
            ],
            'font-src': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
              'data:', // Para fuentes en base64
            ],
            'form-action': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
            ],
            'frame-src': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
              'https://pay.google.com', // Google Pay iframe
            ],
            'connect-src': [
              "'self'",
              'https://sandbox.mcdesaqa.cl',
              'https://h.online-metrix.net', // Sistema antifraude
              'https://play.google.com', // Google Play services
              'https://*.google.com', // Otros servicios de Google
            ],
          },
        },
      })
    );

    // CORS
    this.app.use(cors());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());

    logger.info('Middlewares initialized');
  }

  private initializeRoutes(): void {
    // Health check

    // Página principal - Formulario de pago
    this.app.get('/', (req: Request, res: Response) => {
      res.render('index', {
        title: 'Demo Klap Checkout Flex',
      });
    });


    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    });




    // API Routes
    this.app.use('/', routes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.path,
      });
    });

    logger.info('Routes initialized');
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
    logger.info('Error handling initialized');
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;
