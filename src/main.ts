import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // 쿠키 기반 인증/인가에 쓸 수 있도록, 요청의 쿠키를 읽어 파싱하는 미들웨어를 등록
  // (예: req.cookies에 접근 가능)
  app.use(cookieParser());
  // 모든 라우트 엔드포인트에 'api' 접두어를 설정 (예: /api/...)
  app.setGlobalPrefix('api');

  // 모든 라우트의 요청 본문(body, query, params 등)에 대해 유효성 검사 및 변환을 전역 파이프로 설정
  // - whitelist: true → DTO에 정의되지 않은 속성은 자동으로 제거
  // - forbidNonWhitelisted: true → DTO에 정의되지 않은 값이 있으면 예외를 발생시킴
  // - transform: true → 요청 값을 DTO 타입으로 자동 변환
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // 모든 컨트롤러에서 발생하는 예외를 커스텀 HTTP 예외 필터로 처리하여 일관된 에러 응답을 반환
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger 문서 설정을 위한 DocumentBuilder 인스턴스를 생성
  // - 제목, 설명, 버전, 인증 방식 등을 정의
  const config = new DocumentBuilder()
    .setTitle('Nestjs & Auth API') // API 문서의 제목 설정
    .setDescription('Nestjs를 활용한 사용자 인증 구현') // API 설명 추가
    .setVersion('1.0.0') // API 버전 명시
    .addBearerAuth() // JWT 인증(Bearer token) 스키마 추가
    .build();

  // 위에서 정의한 설정(config)을 바탕으로 Swagger 문서 객체(document) 생성
  const document = SwaggerModule.createDocument(app, config);

  // '/api/docs' 엔드포인트에 Swagger UI를 연결하여 API 문서화된 화면 제공
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
}
bootstrap();
