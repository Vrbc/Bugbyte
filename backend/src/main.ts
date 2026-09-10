import 'dotenv/config';
import { existsSync, mkdirSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UPLOADS_DIR } from './uploads/uploads.constants';

async function bootstrap() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Bugbyte API')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .addServer('http://localhost:3000/api', 'Local')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: 'http://localhost:4200',
  });

  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
