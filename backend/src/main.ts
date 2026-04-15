import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── SECURITY LAYER 1: Helmet ──
  app.use(helmet());

  // ── SECURITY LAYER 2: CORS ──
  // In development, permit local origins. In production, restrict to
  // your deployed frontend domain only.
  const allowedOrigins = [
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:3000',
    'http://localhost:19006',
    'exp://192.168.100.36:8081',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // In development, allow any localhost origin for easier testing
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin ${origin} not permitted.`));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ── SECURITY LAYER 3: Strict Validation ──
  // Strips unknown fields and enforces all DTO constraints.
  // forbidNonWhitelisted rejects requests with extra properties.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,   // Reject unknown properties
      transform: true,              // Auto-transform types (e.g., string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── CLEAN CODE LAYER 1: Global Exception Filter ──
  // Intercepts all errors – standardizes response format, prevents stack trace leaks.
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── CLEAN CODE LAYER 2: Global Response Interceptor ──
  // Wraps all route responses in { data, statusCode, timestamp }
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger docs (disable in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MaliMind API')
      .setDescription('Kenya-first AI Super App — Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 MaliMind API running on http://0.0.0.0:${port}/api/v1`);
  console.log(`🔒 Security: Helmet ✓ | CORS Locked ✓ | Rate Limiting ✓ | Strict Validation ✓`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
  }
}
bootstrap();
