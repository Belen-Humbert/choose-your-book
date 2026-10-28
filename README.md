# Choose Your Book

Web app para elegir tu próxima lectura: cargás tus pendientes, filtrás por formato (Kindle o físico), género y cantidad de páginas, y una ruleta sortea el libro entre los que cumplen.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS (paleta y tipografías "pila de libros": Fraunces + DM Sans)
- Supabase: login con email y Google, base de datos Postgres con seguridad por usuario

## Cómo correrlo

1. Instalá las dependencias:

   ```bash
   npm install
   ```

2. Creá un proyecto en [Supabase](https://supabase.com) y copiá `.env.example` a `.env.local` con la URL y la publishable key del proyecto.

3. Corré el SQL de `supabase/migrations/0001_books.sql` en el SQL Editor de Supabase para crear la tabla `books`.

4. Levantá la app:

   ```bash
   npm run dev
   ```

## Configurar el login

**Email y contraseña** funciona apenas configurás Supabase. Por defecto Supabase manda un mail de confirmación al crear la cuenta (se puede desactivar en Authentication → Sign In / Providers → Email para probar más rápido).

**Google:**

1. En [Google Cloud Console](https://console.cloud.google.com) creá un proyecto, configurá la pantalla de consentimiento OAuth y creá unas credenciales *OAuth client ID* de tipo "Web application".
2. En "Authorized redirect URIs" poné `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
3. En Supabase, Authentication → Sign In / Providers → Google: activalo y pegá el Client ID y el Client Secret.
4. En Supabase, Authentication → URL Configuration: poné `http://localhost:3000` como Site URL y agregá `http://localhost:3000/auth/callback` en Redirect URLs (cuando publiques la app, sumá también tu dominio).

## Estructura

- `src/app`: páginas y estilos globales
- `src/app/login`: pantalla de login y acciones (email, Google, salir)
- `src/app/auth/callback`: vuelta de Google y del mail de confirmación
- `src/lib/supabase`: clientes de Supabase (navegador, servidor y refresco de sesión)
- `src/proxy.ts`: refresca la sesión y manda a `/login` a quien no la tenga
- `supabase/migrations`: esquema de la base de datos

## Próximos pasos

- Pantalla Mi pila (cargar y listar libros)
- Búsqueda de libros con Google Books para autocompletar portada, páginas y género
- Filtros y ruleta
- PWA
