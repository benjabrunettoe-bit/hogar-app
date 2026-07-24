# Guía paso a paso — App Hogar 🏠

Esta guía te lleva de cero a la app funcionando y online. Los pasos marcados
con 💻 los hacés en tu compu; los marcados con 🌐 en el navegador (con tus
cuentas). Está pensada para hacerse una sola vez.

> Ya dejé listos los **íconos de la PWA** (`public/icons/icon-192.png` y
> `icon-512.png`), así que ese punto del README ya está resuelto.

---

## Paso 1 — Crear la base de datos en Supabase 🌐

1. Entrá a https://supabase.com y creá una cuenta gratis.
2. Tocá **New project**. Elegí un nombre (ej. "hogar"), poné una contraseña
   para la base (guardala) y la región más cercana. Esperá 1–2 minutos a que
   se cree.
3. En el menú izquierdo, abrí **SQL Editor** → **New query**. Abrí el archivo
   `supabase/schema.sql` del proyecto, copiá **todo** el contenido, pegalo y
   tocá **Run**. Esto crea las tablas, la seguridad (RLS) y las funciones.
4. Andá a **Authentication → Providers** (o **Sign In / Providers**) y activá
   **Anonymous Sign-Ins**. Es lo que permite el login sin mail. *(Si no lo
   activás, nadie va a poder entrar.)*
5. Andá a **Table Editor → households → Insert row** y creá tu familia:
   - `name`: el nombre de tu familia (ej. "Familia Brune")
   - `invite_code`: un código para compartir, ej. `FAMILIA-BRUNE`
   - `pin`: un PIN de 4 a 6 dígitos (ej. `1234`)
   - (los otros campos se completan solos)
6. Copiá el `id` de esa fila (el UUID largo). Volvé al **SQL Editor**, abrí de
   nuevo `schema.sql`, andá al final donde están las **categorías por defecto**
   (líneas comentadas con `--`), descomentalas, reemplazá `<household_id>` por
   el id que copiaste, y ejecutá **solo ese bloque**. Así arrancás con
   categorías cargadas.
7. Andá a **Project Settings → API** y copiá dos cosas:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key** (una clave larga)

---

## Paso 2 — Correr la app en tu compu 💻

En la carpeta del proyecto, abrí una terminal y ejecutá:

```bash
cp .env.local.example .env.local
```

Abrí el archivo `.env.local` que se creó y pegá los datos del paso 1.7:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-larga
```

Después:

```bash
npm install
npm run dev
```

Abrí http://localhost:3000 — te tiene que llevar al login.

> Necesitás **Node.js 18 o más** instalado. Si `npm` no existe, instalá Node
> desde https://nodejs.org (versión LTS).

---

## Paso 3 — Entrar por primera vez

En la pantalla de login poné el **código de hogar** y el **PIN** que creaste en
el paso 1.5, y elegí tu **nombre** (perfil). Eso queda guardado en ese
dispositivo: las próximas veces entra directo. Cada integrante de la familia
hace lo mismo en su celular con el mismo código + PIN, y elige su propio nombre.

---

## Paso 4 — Gastos/ingresos fijos (opcional)

1. Cargá los fijos a mano en la tabla `fixed_items` de Supabase (nombre,
   categoría, monto estimado, `day_of_month` entre 1 y 28, tipo ingreso/egreso).
   La pantalla **Categorías** de la app ya los muestra y te deja pausarlos.
2. Para que se generen solos cada mes, en Supabase andá a **Database → Cron
   Jobs** (o **Integrations → Cron**), creá un job que corra el **día 1 a las
   6:00**, por ejemplo, con este comando SQL:

   ```sql
   select generate_fixed_transactions();
   ```

---

## Paso 5 — Publicarla online (Vercel) 🌐

Así la usás desde cualquier celular con HTTPS (necesario para instalarla como app).

1. Subí el proyecto a un repositorio de **GitHub** (privado está bien).
2. Entrá a https://vercel.com, iniciá sesión con GitHub y tocá **Add New →
   Project → Import** y elegí el repo.
3. En **Environment Variables** agregá las **mismas dos** del paso 2:
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Tocá **Deploy**. Al terminar te da una URL con HTTPS (ej.
   `https://hogar-xxxx.vercel.app`).

---

## Paso 6 — Instalarla en el celular (PWA)

1. Abrí la URL de Vercel desde el celular en Chrome (Android) o Safari (iPhone).
2. Usá **"Agregar a pantalla de inicio"**. Queda como una app más, con el
   ícono de la casita. Se abre a pantalla completa y funciona incluso con poca
   conexión.

---

## Ideas para más adelante (del README)

- Formulario para crear/editar fijos desde la app (hoy se cargan en Supabase).
- Botón "Analizar mi mes" que manda el resumen a la API de Claude.
- Editar/eliminar movimientos ya cargados.
- Notificaciones push cuando se genera un fijo pendiente.

Cualquier duda en un paso puntual, avisame y lo hacemos juntos. 🙌
