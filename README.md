# nestjs-auth

NestJS로 인증(authentication)을 직접 구현해보는 연습 프로젝트.

## 진행 상태

- [x] bun + biome 기본 세팅
- [x] auth 구현용 라이브러리 설치 (jwt, bcryptjs, class-validator, throttler, resend 등)
- [x] drizzle code first 스키마 작성 (`users`, `tasks`)
- [x] 전역 `HttpExceptionFilter` 구현 — 아직 `main.ts`에 전역 등록은 하지 않음
- [ ] auth 모듈 (회원가입 / 로그인 / 토큰 재발급 / 이메일 인증 / 비밀번호 재설정)
- [ ] tasks 모듈

## 스택

| 구분 | 사용 |
|---|---|
| 프레임워크 | NestJS 11, TypeScript 5.7 |
| 패키지 매니저 | bun |
| lint / format | biome 2.5 |
| DB | PostgreSQL + drizzle-orm (node-postgres) |
| 마이그레이션 | drizzle-kit |
| 인증 | @nestjs/jwt, bcryptjs |
| 메일 | resend |

## 요구사항

- [bun](https://bun.sh) 1.3+
- PostgreSQL 14+

## 시작하기

```bash
bun install

# 환경변수 준비
cp .env.example .env

# JWT 시크릿 생성 (각각 실행해서 .env에 채우기)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 스키마를 DB에 반영
bun run db:push

# 개발 서버 (watch)
bun run start:dev
```

## 환경변수

| 키 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 접속 문자열 |
| `JWT_ACCESS_SECRET` | access 토큰 서명 키 |
| `JWT_REFRESH_SECRET` | refresh 토큰 서명 키 |
| `JWT_ACCESS_EXPIRES_IN` | access 토큰 만료 (기본 `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | refresh 토큰 만료 (기본 `7d`) |
| `RESEND_API_KEY` | Resend API 키 (인증 메일 발송) |
| `APP_URL` | 메일 링크에 사용할 앱 URL |
| `PORT` | 서버 포트 (기본 `3000`) |

## 스크립트

```bash
bun run start:dev      # watch 모드
bun run start:prod     # 빌드 산출물 실행
bun run build          # nest build + tsc-alias (경로 alias 치환)

bun run lint           # biome check
bun run lint:fix       # biome check --write
bun run format         # biome format --write

bun run test           # 유닛 테스트
bun run test:e2e       # e2e 테스트
bun run test:cov       # 커버리지

bun run db:push        # 스키마를 DB에 직접 반영 (개발용)
bun run db:generate    # 마이그레이션 SQL 생성
bun run db:migrate     # 마이그레이션 적용
bun run db:studio      # drizzle studio
```

## DB 스키마

`src/db/schema.ts` 한 곳에서 정의하고 타입을 추출한다 (code first).

**users**

`id`(uuid) · `email`(unique) · `password_hash` · `name` · `role`(`user` \| `admin`)
· `is_verified` · `verification_token` / `verification_token_expires_at`
· `reset_token` / `reset_token_expires_at` · `refresh_token_hash`
· `created_at` / `updated_at`

**tasks**

`id`(uuid) · `title` · `description` · `status`(`todo` \| `in_progress` \| `done`)
· `user_id` → `users.id` (cascade) · `created_at` / `updated_at`

모든 시각 컬럼은 `timestamptz`(`withTimezone: true`)로 통일했다.

## 구조

```
src/
├── common/
│   └── filters/
│       └── http-exception.filter.ts   # 응답 포맷 통일 (statusCode/message/timestamp/path)
├── db/
│   ├── index.ts                       # drizzle 인스턴스 (pg Pool)
│   └── schema.ts                      # code first 스키마 + 추출 타입
├── app.module.ts                      # ConfigModule(isGlobal)
└── main.ts
```

`@/*` 경로 alias를 쓰며, 빌드 시 `tsc-alias`가 실제 경로로 치환한다.
