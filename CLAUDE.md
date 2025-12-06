# stick-crisis-launcher Project Configuration

<!-- CODEAGENTSWARM PROJECT CONFIG START - DO NOT EDIT -->

## Project Configuration

**Project Name**: stick-crisis-launcher

_This project name is used for task organization in CodeAgentSwarm. All tasks created in this directory will be associated with this project._

_For complete CodeAgentSwarm instructions, see the global CLAUDE.md file at ~/.claude/CLAUDE.md_

<!-- CODEAGENTSWARM PROJECT CONFIG END -->

---

## Descripcion del Proyecto

Landing page/launcher para el juego **Stick Crisis** con:
- Seccion hero con enlace a descarga en itch.io
- Changelog publico con ultimos cambios
- Sistema de newsletter con suscripcion/desuscripcion
- Panel de administracion basico

**URL itch.io:** https://vmram95.itch.io/stick-crisis

---

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript |
| Base de datos | Supabase (proyecto ICG-POC, schema `stick_crisis`) |
| Email | EmailJS (@emailjs/browser) |
| Estilos | Tailwind CSS |
| UI Theme | Pixel Art / Retro |
| Deploy | Vercel |

---

## Estrategia de Implementacion

### Principios Generales

1. **Componentes Shared Reutilizables**: Todo componente de UI debe ser generico y reutilizable
2. **Feedback Visual Obligatorio**: Toda accion debe mostrar feedback via Toast
3. **Confirmacion de Acciones Destructivas**: Usar modal de confirmacion para delete/envio masivo
4. **Mobile First**: Disenar primero para movil, luego escalar
5. **Error Handling**: Capturar y mostrar errores de forma amigable

### Orden de Implementacion

```
1. Setup proyecto + dependencias
2. Componentes UI shared (PixelButton, PixelInput, Toast, Modal, etc.)
3. Layout (Header, Footer)
4. Schema Supabase + migracion
5. Landing page (Hero, Features, Changelog, Newsletter)
6. API routes publicas
7. Admin auth + panel
8. API routes admin
9. Integracion EmailJS
10. SEO + Deploy
```

---

## Componentes Shared (src/components/ui/)

### Obligatorios para TODA la aplicacion

| Componente | Descripcion | Uso |
|------------|-------------|-----|
| `PixelButton` | Boton con estilo pixel art | Toda accion clickeable |
| `PixelInput` | Input con estilo retro | Formularios |
| `PixelCard` | Card container | Secciones, items de lista |
| `PixelBadge` | Badge para categorias | Changelog categories |
| `Toast` | Notificaciones temporales | Feedback de acciones |
| `ConfirmModal` | Modal de confirmacion | Acciones destructivas |
| `LoadingSpinner` | Spinner pixel art | Estados de carga |
| `Modal` | Modal generico | Formularios, detalles |

### Implementacion Toast

```typescript
// src/components/ui/Toast.tsx
// Tipos: success, error, warning, info
// Auto-dismiss en 3-5 segundos
// Posicion: bottom-right
// Stack de hasta 3 toasts

// Hook de uso:
const { toast } = useToast();
toast.success('Suscripcion exitosa');
toast.error('Error al enviar email');
```

### Implementacion ConfirmModal

```typescript
// src/components/ui/ConfirmModal.tsx
// Props: title, message, confirmText, cancelText, onConfirm, onCancel, variant (danger/warning)
// SIEMPRE usar para: delete, envio masivo, acciones irreversibles

// Uso:
<ConfirmModal
  isOpen={showConfirm}
  title="Eliminar entrada"
  message="Esta accion no se puede deshacer"
  confirmText="Eliminar"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## Reglas de Feedback Visual

### SIEMPRE mostrar Toast para:

| Accion | Tipo Toast | Mensaje ejemplo |
|--------|------------|-----------------|
| Suscripcion exitosa | success | "Te has suscrito correctamente" |
| Suscripcion fallida | error | "Error: email ya registrado" |
| Changelog creado | success | "Entrada creada correctamente" |
| Changelog actualizado | success | "Cambios guardados" |
| Changelog eliminado | success | "Entrada eliminada" |
| Email enviado | success | "Email enviado a X suscriptores" |
| Error de red | error | "Error de conexion. Intenta de nuevo" |
| Validacion fallida | warning | "Por favor completa todos los campos" |

### SIEMPRE usar ConfirmModal para:

- Eliminar entrada de changelog
- Eliminar suscriptor
- Enviar email masivo a suscriptores
- Logout de admin

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── globals.css              # Estilos globales + variables CSS
│   ├── layout.tsx               # Root layout con ToastProvider
│   ├── page.tsx                 # Landing page
│   ├── unsubscribe/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx           # Admin layout con auth check
│   │   ├── page.tsx             # Dashboard
│   │   ├── changelog/
│   │   │   └── page.tsx
│   │   └── subscribers/
│   │       └── page.tsx
│   └── api/
│       ├── changelog/
│       │   └── route.ts
│       ├── newsletter/
│       │   ├── subscribe/route.ts
│       │   ├── unsubscribe/route.ts
│       │   └── send/route.ts
│       └── admin/
│           ├── auth/route.ts
│           ├── changelog/route.ts
│           └── subscribers/route.ts
│
├── components/
│   ├── ui/                      # COMPONENTES SHARED
│   │   ├── PixelButton.tsx
│   │   ├── PixelInput.tsx
│   │   ├── PixelCard.tsx
│   │   ├── PixelBadge.tsx
│   │   ├── Toast.tsx
│   │   ├── ToastProvider.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Scanlines.tsx
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── ChangelogSection.tsx
│   │   ├── NewsletterSection.tsx
│   │   └── ScreenshotGallery.tsx
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── ChangelogForm.tsx
│       ├── ChangelogList.tsx
│       ├── SubscriberList.tsx
│       └── SendEmailModal.tsx
│
├── hooks/
│   ├── useToast.ts
│   └── useAdminAuth.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client (schema: stick_crisis)
│   │   └── server.ts            # Server client con service role
│   ├── email/
│   │   └── emailjs.ts
│   ├── utils.ts                 # cn(), formatDate(), etc.
│   └── constants.ts             # URLs, configs
│
└── types/
    └── index.ts                 # Changelog, Subscriber, etc.
```

---

## Schema Supabase

**Proyecto:** ICG-POC
**Schema:** `stick_crisis`

```sql
-- Crear schema
CREATE SCHEMA IF NOT EXISTS stick_crisis;

-- Changelog
CREATE TABLE stick_crisis.changelog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Feature',
    release_date DATE DEFAULT CURRENT_DATE,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suscriptores
CREATE TABLE stick_crisis.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribe_token UUID DEFAULT gen_random_uuid()
);

-- Log de emails
CREATE TABLE stick_crisis.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(255) NOT NULL,
    recipient_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent'
);
```

---

## Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vxirigqzqixsihyunazf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxx
NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE_ID=template_xxx
NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID=template_xxx

# Admin
ADMIN_PASSWORD=xxx

# App
NEXT_PUBLIC_APP_URL=https://stick-crisis.vercel.app
NEXT_PUBLIC_ITCH_URL=https://vmram95.itch.io/stick-crisis
```

---

## Paleta de Colores

```css
:root {
  /* Fondos */
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --bg-card: #16213e;

  /* Acentos neon */
  --accent-green: #00ff41;      /* Feature, Success */
  --accent-pink: #ff0080;       /* Breaking, Danger */
  --accent-cyan: #00ffff;       /* Security, Info */
  --accent-yellow: #ffd93d;     /* Improvement, Warning */
  --accent-red: #ff6b6b;        /* Bugfix, Error */

  /* Texto */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
}
```

---

## Tipografia

- **Headings:** Press Start 2P (Google Fonts)
- **Body:** System fonts / monospace fallback
- **Tamanos:** Multiplos de 8px (8, 16, 24, 32)

---

## API Routes

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/changelog` | Changelog publico (limit 5) | No |
| POST | `/api/newsletter/subscribe` | Suscribir email | No |
| POST | `/api/newsletter/unsubscribe` | Desuscribir | No |
| POST | `/api/admin/auth` | Login admin | No |
| GET | `/api/admin/changelog` | Listar todos | Admin |
| POST | `/api/admin/changelog` | Crear entrada | Admin |
| PUT | `/api/admin/changelog` | Actualizar | Admin |
| DELETE | `/api/admin/changelog` | Eliminar | Admin |
| GET | `/api/admin/subscribers` | Listar suscriptores | Admin |
| DELETE | `/api/admin/subscribers` | Eliminar suscriptor | Admin |
| POST | `/api/newsletter/send` | Enviar email masivo | Admin |

---

## Checklist Pre-Implementacion

Antes de implementar cualquier feature:

- [ ] Componentes UI shared estan creados?
- [ ] ToastProvider esta en el root layout?
- [ ] Hook useToast disponible?
- [ ] ConfirmModal disponible para acciones destructivas?
- [ ] Tipos TypeScript definidos?
- [ ] Variables de entorno configuradas?
