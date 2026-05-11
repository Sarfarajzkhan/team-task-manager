import {
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';

import {
  NestFactory,
} from '@nestjs/core';

import { NestExpressApplication } from '@nestjs/platform-express';

import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import expressLayouts from 'express-ejs-layouts';

import { join } from 'path';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'cdn.jsdelivr.net',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'cdn.jsdelivr.net',
            'fonts.googleapis.com',
          ],
          fontSrc: [
            "'self'",
            'fonts.gstatic.com',
            'cdn.jsdelivr.net',
          ],
          imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
        },
      },
    }),
  );

  app.use(compression());

  app.use(cookieParser());

  const express = require('express');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.enableCors();

  /*
  ===========================================
  STATIC FILES
  ===========================================
  */

  app.useStaticAssets(
    join(__dirname, '..', 'public'),
  );

  /*
  ===========================================
  EJS SETUP
  ===========================================
  */

  app.setBaseViewsDir(
    join(__dirname, 'views'),
  );

  app.setViewEngine('ejs');

  app.use(expressLayouts);

  app.set('layout', 'layouts/main');

  /*
  ===========================================
  GLOBAL VALIDATION
  ===========================================
  */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /*
  ===========================================
  GLOBAL FILTERS
  ===========================================
  */

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  /*
  ===========================================
  GLOBAL INTERCEPTORS
  ===========================================
  */

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
  );

  /*
  ===========================================
  SWAGGER
  ===========================================
  */

  const config = new DocumentBuilder()
    .setTitle('Team Task Manager API')
    .setDescription(
      'Backend APIs for Team Task Manager Assignment',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document =
    SwaggerModule.createDocument(
      app,
      config,
    );

  SwaggerModule.setup(
    'api/docs',
    app,
    document,
  );

  await app.listen(
    process.env.PORT || 5000,
  );

  console.log(
    `Server running on: http://localhost:${process.env.PORT || 5000}`,
  );
}

bootstrap();