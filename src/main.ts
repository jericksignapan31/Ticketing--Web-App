import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppDataSource } from './data-source';

async function runMigrations() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Ensure soft delete columns exist on asset table
    await AppDataSource.query(`
      ALTER TABLE "asset" 
      ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL
    `);
    
    console.log('✅ Migration: Soft delete columns verified/added to asset table');
  } catch (error) {
    console.warn('⚠️ Migration check: Asset soft delete columns may already exist');
  }
}

async function bootstrap() {
  // Run migrations first
  await runMigrations();
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security: CORS - Configure allowed origins (must be before helmet)
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: (origin, callback) => {
      // Allow no-origin clients (Postman/server-to-server/Swagger UI)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow same-origin Swagger UI on Render
      if (process.env.RENDER_EXTERNAL_URL && origin === process.env.RENDER_EXTERNAL_URL) {
        callback(null, true);
        return;
      }

      // Allow configured origin(s)
      if (corsOrigin) {
        const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
      }

      // Development: allow localhost frontend ports
      if (origin.startsWith('http://localhost:')) {
        callback(null, true);
        return;
      }

      // Reject — pass false, not an Error (Error causes 500)
      callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Security: Helmet - Sets various HTTP headers for security (after CORS)
  app.use(helmet());

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('IT Help Desk API')
    .setDescription('The IT Help Desk API documentation')
    .setVersion('1.0')
    .addTag('helpdesk')
    .addTag('Authentication')
    .addTag('Employees')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port, '0.0.0.0');
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  console.log(`Application is running on: ${baseUrl}`);
  console.log(`Swagger documentation is available at: ${baseUrl}/api`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
