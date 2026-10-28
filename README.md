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

## Estructura

- `src/app`: páginas y estilos globales
- `src/lib/supabase`: clientes de Supabase (navegador, servidor y refresco de sesión)
- `src/proxy.ts`: refresca la sesión en cada request
- `supabase/migrations`: esquema de la base de datos

## Próximos pasos

- Login con email y Google
- Pantalla Mi pila (cargar y listar libros)
- Búsqueda de libros con Google Books para autocompletar portada, páginas y género
- Filtros y ruleta
- PWA
