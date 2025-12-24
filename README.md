# Plantilla Portal - Template Base

Plantilla base para crear aplicaciones web con React + Vite + TypeScript + Tailwind CSS. Diseñada como punto de partida para desarrollar portales y aplicaciones web con un sistema de temas integrado y componentes UI reutilizables.

## Características

- **React 19** + **Vite** - Build tool rápido y moderno
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **Sistema de Temas** - Soporte para modo claro/oscuro con sincronización entre pestañas
- **Componentes UI** - Biblioteca de componentes base (Button, Card, Dialog, Badge, Separator, Spinner)
- **Diseño Responsive** - Mobile-first con breakpoints
- **Animaciones** - Animaciones de entrada suaves
- **ESLint** - Linting configurado

## Estructura del Proyecto

```
plantilla-portal/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes UI base reutilizables
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── separator.tsx
│   │   │   └── spinner.tsx
│   │   └── Login.tsx        # Componente de login genérico
│   ├── lib/
│   │   ├── useThemeClasses.ts  # Hook para clases de tema
│   │   └── utils.ts            # Utilidades (cn helper)
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globales y animaciones
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Comenzando

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 3. Construir para producción

```bash
npm run build
```

Los archivos compilados estarán en el directorio `dist/`

## Personalización

### Modificar el Login

El componente `Login.tsx` es una plantilla genérica. Para personalizar:

1. Abre `src/components/Login.tsx`
2. Agrega tus campos de formulario (usuario, contraseña, etc.)
3. Implementa tu lógica de autenticación en `handleLogin`
4. Personaliza los textos y estilos

```tsx
// Ejemplo de personalización
const handleLogin = (username: string, password: string) => {
  // Tu lógica de autenticación aquí
  if (authenticate(username, password)) {
    onLogin(username)
  }
}
```

### Modificar el Contenido Principal

El componente `App.tsx` tiene un área marcada para agregar tu contenido:

```tsx
{/* MAIN CONTENT - AGREGA TU CONTENIDO AQUÍ */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Tus componentes aquí */}
</div>
```

### Personalizar Colores y Temas

Los colores del tema se definen en `src/lib/useThemeClasses.ts`:

```tsx
return {
  bg: isDark ? 'bg-[#141413]' : 'bg-[#FAF9F5]',
  bgCard: isDark ? 'bg-[#1F1E1D]' : 'bg-[#FFFFFF]',
  text: isDark ? 'text-[#E5E4E0]' : 'text-[#141413]',
  // ... más colores
}
```

### Agregar Nuevos Componentes UI

Los componentes UI siguen el patrón de [shadcn/ui](https://ui.shadcn.com/). Para agregar nuevos componentes:

1. Crea el archivo en `src/components/ui/`
2. Usa el helper `cn()` para combinar clases:

```tsx
import { cn } from "@/lib/utils"

export function MiComponente({ className, ...props }) {
  return (
    <div className={cn("clases-base", className)} {...props} />
  )
}
```

## Componentes Disponibles

### Button

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Contenido</CardContent>
</Card>
```

### Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del diálogo</DialogTitle>
    </DialogHeader>
    <p>Contenido del diálogo</p>
  </DialogContent>
</Dialog>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">Default</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secondary</Badge>
```

### Separator

```tsx
import { Separator } from "@/components/ui/separator"

<Separator />
<Separator orientation="vertical" />
```

### Spinner

```tsx
import { Spinner } from "@/components/ui/spinner"

<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

## Sistema de Temas

El proyecto incluye un sistema de temas completo con soporte para modo claro y oscuro:

### Uso en componentes

```tsx
import { useThemeClasses } from "@/lib/useThemeClasses"

function MiComponento() {
  const themeClasses = useThemeClasses(theme)

  return (
    <div className={themeClasses.bgCard}>
      <p className={themeClasses.text}>Texto con tema</p>
    </div>
  )
}
```

### Sincronización entre pestañas

El tema se sincroniza automáticamente entre pestañas usando `localStorage` y `CustomEvent`:

```tsx
// Disparar cambio de tema
window.dispatchEvent(new CustomEvent('themeChanged', {
  detail: { theme: 'light' }
}))

// Escuchar cambios
window.addEventListener('themeChanged', (e) => {
  console.log(e.detail.theme)
})
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Construye para producción |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta ESLint |

## Tecnologías Utilizadas

- [React 19](https://react.dev/) - Biblioteca UI
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Radix UI](https://www.radix-ui.com/) - Componentes UI headless
- [Lucide React](https://lucide.dev/) - Iconos
- [class-variance-authority](https://cva.style/) - Variantes de componentes

## Licencia

MIT

## Autor

Creado como plantilla base para el desarrollo de aplicaciones web.
# plantilla-portal
