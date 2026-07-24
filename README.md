# Hogar — App de finanzas familiares

App para cargar ingresos y gastos en segundos, ver un calendario mensual,
resúmenes por categoría, y automatizar gastos/ingresos fijos. Pensada como
PWA (se instala en el celular sin pasar por las tiendas de apps).

## Stack
- **Next.js 14** (React) — una sola app para celular y compu
- **Supabase** — base de datos Postgres + autenticación + API
- **Tailwind CSS** — estilos
- **Recharts** — gráficos del resumen

## 1. Crear el proyecto en Supabase
1. Andá a [supabase.com](https://supabase.com), creá un proyecto gratis.
2. En **SQL Editor**, pegá y ejecutá todo el contenido de `supabase/schema.sql`.
   Esto crea las tablas, la seguridad (RLS) y las funciones necesarias.
3. Andá a **Authentication > Providers** y asegurate de que **Anonymous Sign-Ins**
   esté habilitado (lo usamos para el login sin mail).
4. En **Table Editor**, insertá una fila en `households` con:
   - `name`: el nombre de tu familia
   - `invite_code`: un código que van a usar todos, ej. `FAMILIA-MOLINA`
   - `pin`: un PIN de 4 a 6 dígitos
5. Copiá el `id` de esa fila y usalo para insertar las categorías por defecto
   (están comentadas al final de `schema.sql`, solo hay que descomentar y
   reemplazar `<household_id>`).
6. En **Project Settings > API**, copiá la `URL` y la `anon public key`.

## 2. Configurar el proyecto localmente
```bash
cp .env.local.example .env.local
# pegá ahí la URL y la anon key de Supabase
npm install
npm run dev
```
Abrí `http://localhost:3000` — debería llevarte al login.

## 3. Login
Entrás con el código de hogar + PIN que configuraste en Supabase, y elegís
tu nombre (perfil). Solo se pide una vez por dispositivo: la sesión queda
guardada y las próximas veces entra directo.

## 4. Automatizar los gastos/ingresos fijos
- Cargalos manualmente por ahora en la tabla `fixed_items` de Supabase
  (nombre, categoría, monto estimado, día del mes). La pantalla de
  Categorías ya los muestra y permite pausarlos/activarlos.
- Para que se generen solos cada mes, en Supabase andá a
  **Database > Cron Jobs** y programá:
  ```sql
  select generate_fixed_transactions();
  ```
  para que corra el día 1 de cada mes a la hora que prefieras.

## 5. Convertirla en PWA instalable
El manifest y el service worker ya están armados (`public/manifest.json`,
`public/sw.js`). Solo falta:
1. Agregar los íconos reales en `public/icons/icon-192.png` y
   `public/icons/icon-512.png` (podés generarlos con cualquier editor o
   herramienta online a partir de un logo cuadrado).
2. Desplegar la app con HTTPS (los service workers no funcionan en `http://`
   salvo en `localhost`) — ver paso 6.
3. Desde el celular, abrir la web y usar "Agregar a pantalla de inicio"
   (Chrome/Safari lo sugieren solos cuando detectan el manifest).

## 6. Desplegar (dejarla online)
La forma más simple es [Vercel](https://vercel.com):
1. Subí este proyecto a un repo de GitHub.
2. En Vercel, "Import Project" → elegí el repo.
3. Agregá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en la config del proyecto en Vercel.
4. Deploy. Te da una URL con HTTPS lista para instalar como PWA.

## Estructura del proyecto
```
app/
  login/            → pantalla de login (código + PIN + perfil)
  (app)/
    hoy/             → movimientos del día
    calendario/      → vista mensual con calendario
    resumen/         → gráficos por categoría (mes/año)
    categorias/      → gestión de categorías y fijos
  layout.tsx         → layout raíz + registro del service worker
components/
  BottomNav.tsx
  QuickAddModal.tsx  → el botón "+" de carga rápida
  PwaRegister.tsx
lib/supabase/
  client.ts          → cliente de Supabase
  session.ts         → lógica de login sin mail (código + PIN + perfil)
supabase/
  schema.sql         → todo el esquema de base de datos + seguridad
public/
  manifest.json, sw.js → configuración PWA
```

## Roadmap sugerido (próximas vueltas)
- Formulario para crear/editar fijos directo desde la app (hoy se cargan
  en Supabase a mano).
- Botón "Analizar mi mes" que le manda el resumen a la API de Claude y
  devuelve observaciones en texto.
- Editar/eliminar movimientos ya cargados.
- Notificaciones push cuando se genera un fijo pendiente.
