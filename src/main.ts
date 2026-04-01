import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security: Helmet - Sets various HTTP headers for security
  app.use(helmet());

  // Security: CORS - Configure allowed origins
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

      // Production: allow configured origin(s)
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : [];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
        return;
      }

      // Development: allow localhost frontend ports
      if (origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

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

  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  console.log(`Application is running on: ${baseUrl}`);
  console.log(`Swagger documentation is available at: ${baseUrl}/api`);
}
bootstrap();
