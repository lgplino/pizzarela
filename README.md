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

## Modos

1. **Ver cardápio** — só olhar
2. **Colocar / tirar** — escolher pessoa e clicar no dia
3. **Trocar fatias** — duas pessoas, confirma troca
