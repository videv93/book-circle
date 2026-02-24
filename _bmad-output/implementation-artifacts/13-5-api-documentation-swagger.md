# Story 13.5: API Documentation (OpenAPI/Swagger)

Status: ready-for-dev

## Story

As a developer building the React Native app,
I want interactive API documentation via Swagger UI,
so that I can explore and test all endpoints without reading source code.

## Acceptance Criteria

1. Swagger UI available at `GET /api/docs` in development
2. OpenAPI 3.0 spec available at `GET /api/docs-json`
3. All endpoints documented with request/response schemas
4. Auth endpoints show JWT bearer token requirement
5. DTOs generate accurate schema via decorators
6. Swagger UI supports "Authorize" button for JWT token input
7. API versioning prefix: all endpoints under `/api/v1/`

## Tasks / Subtasks

- [ ] Task 1: Swagger setup (AC: #1, #2, #6)
  - [ ] Install `@nestjs/swagger`
  - [ ] Configure in `main.ts` with DocumentBuilder
  - [ ] Set title: "Book Circle Mobile API"
  - [ ] Set version: "1.0"
  - [ ] Add bearer auth security scheme
  - [ ] Mount at `/api/docs`

- [ ] Task 2: API versioning (AC: #7)
  - [ ] Add global prefix `/api/v1` in `main.ts`
  - [ ] Update all controller routes (remove leading `/` if needed)
  - [ ] Swagger base path reflects versioned URLs

- [ ] Task 3: Endpoint documentation (AC: #3, #4)
  - [ ] Add `@ApiTags()` to each controller (Books, Sessions, Streaks, etc.)
  - [ ] Add `@ApiOperation()` with summary for each endpoint
  - [ ] Add `@ApiResponse()` for success and error responses
  - [ ] Add `@ApiBearerAuth()` to protected endpoints
  - [ ] Add `@ApiQuery()` for pagination and filter params

- [ ] Task 4: DTO schema decorators (AC: #5)
  - [ ] Add `@ApiProperty()` to all DTO classes
  - [ ] Include examples, descriptions, and required flags
  - [ ] Ensure enum types render correctly (ReadingStatus, etc.)

- [ ] Task 5: Verify (AC: all)
  - [ ] Open `/api/docs` — all endpoints visible and grouped
  - [ ] Test "Try it out" with a real JWT token
  - [ ] Verify request/response schemas match actual behavior

## Dev Notes

### Swagger Setup Pattern

```typescript
// mobile-api/src/main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Book Circle Mobile API')
  .setDescription('REST API for Book Circle iOS and Android apps')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Final API Route Structure

After versioning, all endpoints become:
- `POST /api/v1/auth/register`
- `GET /api/v1/books/search?q=`
- `GET /api/v1/streaks/current`
- `POST /api/v1/pusher/auth`
- etc.

### DTO Example with Swagger Decorators

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123', minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false, example: 'Jane Doe' })
  name?: string;
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-list.md#Epic 13 — API documentation story]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Patterns]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
