# VamoJoga — Web

Frontend da plataforma VamoJoga, construído com Next.js 16 e Tailwind CSS v4.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 · Tailwind CSS v4 |
| Linguagem | TypeScript |
| Auth | JWT via contexto React (`AuthContext`) |

## Estrutura

```
src/
├── app/                  # Pages (App Router)
│   ├── login/
│   ├── register/
│   ├── matches/          # Lista, detalhes e criação de partidas
│   ├── friends/
│   └── leaderboard/
├── components/
│   ├── layout/           # BottomNav, PageContainer, PageHeader
│   ├── match/            # GameAutocomplete, MatchCard, PlayerAutocomplete
│   ├── leaderboard/      # RankingRow
│   └── ui/               # Avatar, Badge, Button, Card
├── lib/
│   ├── api.ts            # Cliente HTTP para a API
│   ├── auth-context.tsx  # Contexto de autenticação (JWT)
│   └── utils.ts
└── types/
    └── index.ts
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

A API deve estar rodando em `http://localhost:8000`. Configure a URL base em `src/lib/api.ts` se necessário.

## Build

```bash
npm run build
npm run start
```
