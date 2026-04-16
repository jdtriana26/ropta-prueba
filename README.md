# Multi Flash

E-commerce para artículos del hogar y cuidado personal. Ecuador.

## Stack
- React 19 + Vite 8 + Tailwind 3
- Supabase (auth + postgres + storage + edge functions)
- PayPhone (pasarela de pagos)
- Zustand + React Query

## Setup
```bash
npm install
cp .env.example .env   # completa las variables
npm run dev
```

## Variables de entorno
Ver `.env.example`. El token de PayPhone vive solo en Edge Functions (nunca en el cliente).

## Deploy
- Frontend: Vercel (auto desde main)
- Backend: Supabase Edge Functions (`supabase functions deploy`)