import { useState, useEffect } from "react"
import { useThemeClasses } from "@/lib/useThemeClasses"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ResourceMonitor } from "@/components/ResourceMonitor"
import { LogViewer } from "@/components/LogViewer"
import {
  Moon,
  Sun,
  Shield,
} from "lucide-react"

/**
 * Componente Principal de la Aplicación
 *
 * PLANTILLA BASE - Sin autenticación
 *
 * Este componente proporciona:
 * - Gestión de temas (claro/oscuro)
 * - Top bar con navegación
 * - Área de contenido principal vacía lista para usar
 *
 * Para personalizar:
 * 1. Modifica el título y subtítulo en el header
 * 2. Agrega tu contenido principal donde está el comentario "MAIN CONTENT"
 */
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const savedTheme = (localStorage.getItem('portal_theme') as 'light' | 'dark') || 'dark'

    // Apply theme immediately to prevent any color flashing
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    setTheme(savedTheme)
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Escuchar cambios de tema desde otras pestañas/aplicaciones
  useEffect(() => {
    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'light' | 'dark' }>
      if (customEvent.detail?.theme && ['light', 'dark'].includes(customEvent.detail.theme)) {
        setTheme(customEvent.detail.theme)
      }
    }

    window.addEventListener('themeChanged', handleThemeEvent)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portal_theme' && e.newValue) {
        setTheme(e.newValue as 'light' | 'dark')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('themeChanged', handleThemeEvent)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('portal_theme', newTheme)
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: newTheme }
    }))
  }

  const themeClasses = useThemeClasses(theme)
  const isDark = theme === 'dark'
  const isLogView = typeof window !== 'undefined' && window.location.pathname.includes('/logs')

  return (
    <div className={`min-h-screen gradient-background relative`}>

        {/* Top Bar */}
        <div className={`border-b ${themeClasses.borderLight} relative z-10 animate-fade-in`}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${themeClasses.bgCard} ${themeClasses.border}`}>
                <Shield className={`w-4 h-4 ${themeClasses.text}`} />
              </div>
              <a
                href="/"
                className={`text-base font-medium ${themeClasses.text} transition-opacity hover:opacity-80`}
              >
                Telecomunicaciones y Automatismos
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                className={`border-2 ${themeClasses.border} ${themeClasses.text} rounded-md h-8 px-3 gap-2 font-semibold hover:cursor-pointer`}
                aria-label="Volver al portal"
              >
                <a href="/">Volver al portal</a>
              </Button>

              <Button
                onClick={toggleTheme}
                variant="outline"
                size="icon"
                className={`border-2 ${themeClasses.border} ${themeClasses.text} rounded-md h-8 w-8 hover:cursor-pointer`}
              >
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-6 px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 mt-8">
              <div className={`text-sm ${themeClasses.textMuted} flex items-center gap-2 animate-fade-in`}>
                <a href="/" className="hover:underline">Portal</a>
                <span>/</span>
                <span>Monitor</span>
              </div>
              <h1 className={`text-4xl font-bold tracking-tight ${themeClasses.text} mt-2 animate-fade-in`}>
                {isLogView ? 'Logs del Sistema' : 'Monitor de Recursos'}
              </h1>
              <p className={`text-base mt-2 ${themeClasses.textSubtle} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
                {isLogView ? 'Consulta de logs con paginado desde el final.' : 'Monitoreo en tiempo real del servidor'}
              </p>
            </div>

            <Separator className="mb-8 opacity-50 animate-fade-in" style={{ animationDelay: '0.2s' }} />

            {/* Main Content */}
            {isLogView ? <LogViewer theme={theme} /> : <ResourceMonitor theme={theme} />}

            {/* Footer Separator */}
            <Separator className="mt-8 mb-4 opacity-50 animate-fade-in" style={{ animationDelay: '0.8s' }} />
          </div>
        </div>
      </div>
  )
}

export default App
