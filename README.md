# GymApp
Aplicación mobile enfocada a gimnasios, la cual esta enfocada a ayudar al gimnasio a organizar sus clientes. y a los clientes a no depender de la asistencia humana dentro del mismo.

## Stack

- **Frontend**: React Native + [Expo](https://docs.expo.dev/) (Expo Router), TypeScript.
- **Backend**: [Supabase](https://supabase.com/) (Postgres, Auth, Storage).

## Setup

1. `npm install`
2. Copiar `.env.example` a `.env` y completar con las credenciales del proyecto Supabase (Project Settings → API):
   ```
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   ```
3. `npm run start` (o `npm run web` / `npm run android` / `npm run ios`)

## Estructura

- `src/app` — pantallas y layouts (file-based routing de Expo Router).
- `src/lib/supabase.ts` — cliente de Supabase configurado con persistencia de sesión.
