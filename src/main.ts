import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLogger } from './logger/custom-logger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { resolve } from 'path';

async function bootstrap(logger: CustomLogger) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });

  app.useStaticAssets(resolve('./src/public'));
  app.setBaseViewsDir(resolve('./src/views'));
  app.setViewEngine('ejs');

  app.use(cookieParser());

  // so browsers can use api
  app.enableCors({
    origin: '*',
  });

  await app.listen(3030);
}

// Create the CustomLogger
const logger = new CustomLogger('Bootstrap');

bootstrap(logger);
