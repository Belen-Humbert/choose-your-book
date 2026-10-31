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

3. Corré, en este orden, el SQL de `supabase/migrations/0001_books.sql` (crea la tabla `books`), `0002_covers.sql` (el espacio para las portadas que se suben) y `0003_progress.sql` (la página por la que va cada libro) `0004_notes.sql` (las notas de lectura) y `0005_progress_percent.sql` (el porcentaje de avance) en el SQL Editor de Supabase. Hay que pegar el contenido de cada archivo, no su nombre.

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

## Importar desde Goodreads

Desde "Sumá un libro" → "¿Ya tenés una lista en Goodreads? Importala" (`/pila/importar`) se sube el CSV que Goodreads genera en Mis libros → Importación/Exportación. Se puede importar solo "quiero leer" o todo (los estantes `to-read`, `currently-reading` y `read` pasan a Por leer, Leyendo y Leídos). Los "Kindle Edition" y similares quedan como digital; si el archivo no dice el formato, se usa el que elijas. Los libros que ya están en la pila (mismo título y autor) se saltean. Límite: 2 MB y 1000 libros. No necesita migración nueva.

## Progreso de lectura

Los libros que estás leyendo muestran una barra con la página actual y el porcentaje. El botón **Actualizar progreso** abre un panel como el de Goodreads: "Voy por la página [__] de N" o "Voy por el [__] %" (selector `#` / `%`, porque los lectores digitales muestran porcentaje), con una nota opcional que queda guardada con esa posición. No deja pasar del total, y en el inicio se ve resumido. Si el libro no tiene el total de páginas cargado, se guarda la página pero no hay barra. Al tocar "Lo terminé", el progreso queda al 100%. Requiere `0003_progress.sql` y `0005_progress_percent.sql`.

## Notas de lectura

Tocando un libro en Mi pila (o en "Leyendo ahora") se abre su detalle: portada, datos, progreso (si lo estás leyendo) y sus **notas**. Cada nota se guarda con la fecha y la hora, que se muestran en la zona horaria de quien mira la app, y con la página y/o el porcentaje en que ibas al escribirla ("Página 225 · 54%"). Si estás leyendo el libro, la nota se escribe en el panel de Actualizar progreso. Se pueden borrar. Cada persona ve solo sus notas y solo puede escribir en sus libros. Al quitar un libro se borran también sus notas. Requiere `supabase/migrations/0004_notes.sql`.

## Próximos pasos

- Importar listas desde un CSV (Goodreads, o Fable con una extensión de terceros)
- Editar un libro ya cargado
- PWA
- Publicar en Vercel
