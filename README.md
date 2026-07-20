# Pizzarela

Quem come pizza em casa — cardápio compartilhado do time. Todo mundo pode editar.

## Regras

- 1 fatia (HO) por pessoa por semana
- Até 2 pessoas no mesmo dia
- Trocas e alocações livres na interface

## Setup

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy (CloudFront)

Este app é **Next.js com API + SQLite** — não roda como site estático puro no S3.

Fluxo típico atrás do CloudFront:

1. Subir o container (`Dockerfile`) em ECS/EC2/App Runner (ou similar)
2. Apontar o CloudFront para essa origem (HTTP 3000)
3. Montar volume em `/data` para persistir o SQLite
4. Na primeira vez: `npm run db:seed` (ou rodar seed uma vez no container)

```bash
docker build -t pizzarela .
docker run -p 3000:3000 -v pizzarela-data:/data pizzarela
```
