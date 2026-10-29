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

3. Corré, en este orden, el SQL de `supabase/migrations/0001_books.sql` (crea la tabla `books`) y el de `supabase/migrations/0002_covers.sql` (crea el espacio para las portadas que se suben) en el SQL Editor de Supabase.

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
- `src/app/(app)`: pantallas con sesión iniciada (inicio/ruleta, `pila` y `pila/nueva`) con el menú inferior
- `src/app/login`: pantalla de login y acciones (email, Google, salir)
- `src/components`: menú inferior, fila de libro y avisos
- `src/app/auth/callback`: vuelta de Google y del mail de confirmación
- `src/lib/supabase`: clientes de Supabase (navegador, servidor y refresco de sesión)
- `src/proxy.ts`: refresca la sesión y manda a `/login` a quien no la tenga
- `supabase/migrations`: esquema de la base de datos

## Búsqueda con Google Books

Al agregar un libro (`/pila/nueva`) podés buscarlo por título, autor o ISBN. La búsqueda pasa por `/api/libros/buscar` (solo con sesión iniciada) y autocompleta portada, páginas, autor y género. Los géneros de Google se llevan a los de la app en `src/lib/googleBooks.ts`.

Si Google Books falla (cuota, caída, red) o no encuentra nada, la app busca automáticamente en **Open Library** (`src/lib/openLibrary.ts`, sin API key). Esos resultados pueden venir con menos datos, por ejemplo sin páginas, y el buscador lo avisa. Los libros que vienen de Open Library se guardan con un id que empieza con `ol:`.

Funciona sin configurar nada, pero Google limita las búsquedas anónimas. Si ves errores de cuota, creá una API key de Books API en Google Cloud Console y agregala a `.env.local` como `GOOGLE_BOOKS_API_KEY` (también en las variables de entorno del hosting, sin el prefijo `NEXT_PUBLIC_`).

## Portadas propias

Al agregar un libro se puede subir la portada desde el dispositivo (galería, archivos o la cámara del celu). La imagen se achica en el navegador (máximo 900 px de lado, WebP o JPEG) y se guarda en Supabase Storage, en el bucket público `covers`, dentro de una carpeta con el id de cada usuario. Cada persona solo puede subir, ver y borrar en su carpeta. Se puede reemplazar la portada que trae la búsqueda por una propia. Al quitar un libro se borra también su imagen subida.

Requiere haber corrido `supabase/migrations/0002_covers.sql`. Si no, la app avisa que falta crear el espacio de portadas.

## Estados de lectura

Cada libro está en "Por leer", "Leyendo" o "Leído". Se cambia desde Mi pila o con el botón "Empezar a leer" de la ruleta. Lo que estás leyendo aparece arriba en el inicio, y la ruleta solo sortea entre los "Por leer".

## Próximos pasos

- Importar listas desde un CSV (Goodreads, o Fable con una extensión de terceros)
- Editar un libro ya cargado
- PWA
- Publicar en Vercel
