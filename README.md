# ✪ Kirby Bot

> Discord.js & Supabase 기반 출석 관리 자동화 봇

## Key Features

* 슬래시 커맨드를 통한 자발적 출석 체크
* 일간/주간 스케쥴러 내장(점심 알림/공결신청 스레드/주간 출석통계)
* 법정공휴일 기반 출석로그 공결(`excused`)처리

## Tech Stack

| 분류 | 기술 |
| --- | --- |
| **Runtime** | Bun, Deno (Edge Functions) |
| **Language** | TypeScript |
| **Library** | Discord.js v14, Day.js |
| **Database** | Supabase (PostgreSQL) |
| **Infra** | Supabase Edge Functions, GitHub Actions |

## Environment Variables

> 프로젝트 실행을 위해 다음 환경 변수가 필요합니다.

```env
DISCORD_TOKEN=your_discord_bot_token
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DEFAULT_CHANNEL_ID=your_main_channel_id
EXCUSION_CHANNEL_ID=your_log_channel_id
```

## Getting Started

```bash
# 의존성 설치
bun install

# 실행
bun dev     # 개발 모드
bun start   # 빌드 및 시작
```
