# Pizzarela

Quem come pizza em casa — cardápio compartilhado do time. Todo mundo pode editar.

## Regras

- 1 fatia (HO) por pessoa por semana
- Até 2 pessoas no mesmo dia
- Trocas e alocações livres na interface

## Setup local

1. Crie um Postgres (ex.: [Neon](https://neon.tech) free)
2. Copie a connection string

```bash
cp .env.example .env
# edite DATABASE_URL
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Deploy na Vercel

1. Importe o repo no Vercel
2. Em **Settings → Environment Variables**, adicione:

| Name | Value |
|------|--------|
| `DATABASE_URL` | connection string **pooled** do Neon (ou Vercel Postgres) |

3. Redeploy
4. Depois do primeiro deploy, rode o seed (pessoas + cronograma 20/07 e 27/07):

```bash
curl -X POST "https://SEU-APP.vercel.app/api/seed" \
  -H "x-seed-secret: pizzarela-seed"
```

Para resetar e popular de novo: acrescente `?force=1`.

Ou localmente apontando pro Neon:

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

SQLite **não** funciona na Vercel. Use Postgres.

## Geração automática (`POST /api/generate`)

Regras **só na geração** (edições manuais podem furar):

- Seg–Qui: no máximo **1** pessoa
- Sexta: **2** pessoas
- Lino e Rossi preferem **seg / qua / sex** (soft)
- 1 fatia por pessoa por semana, quando houver slot

```bash
curl -X POST "https://SEU-APP.vercel.app/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"monthKey":"2026-08"}'
```
