import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Important for webhook signature validation
  });

  const configService = app.get(ConfigService);

  // Security: Helmet for HTTP headers
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: configService.get('appUrl'),
    credentials: true,
  });

  // Global filters and pipes
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(ValidationPipe);

  // Set global prefix
  app.setGlobalPrefix('');

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription(
      'A production-ready wallet service with Google OAuth, Paystack payments, and API key management',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token from Google OAuth',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for service-to-service authentication',
      },
      'API-Key',
    )
    .addTag('Authentication', 'Google OAuth and JWT endpoints')
    .addTag('Wallet', 'Wallet balance and transaction history')
    .addTag('Deposits', 'Paystack deposit operations')
    .addTag('Transfers', 'Wallet-to-wallet transfers')
    .addTag('API Keys', 'API key management for service access')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
