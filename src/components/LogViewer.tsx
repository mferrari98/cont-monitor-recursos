import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useThemeClasses } from "@/lib/useThemeClasses"

const DEFAULT_LIMIT = 300

const LOG_SOURCES = {
  nginx: "Nginx",
  'nginx-error': "Nginx (error)",
  reportespiolis: "Reportespiolis"
} as const

type LogSource = keyof typeof LOG_SOURCES

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    if (path.startsWith('/monitor')) {
      return '/monitor'
    }
  }

  return '.'
}

const API_URL: string = getApiBaseUrl()

const resolveSource = (): LogSource => {
  if (typeof window === 'undefined') {
    return 'nginx'
  }

  const params = new URLSearchParams(window.location.search)
  const source = params.get('source')
  if (source === 'reportespiolis' || source === 'nginx-error') {
    return source
  }
  return 'nginx'
}

interface LogResponse {
  lines: string[]
  hasMore: boolean
  limit: number
  offset: number
  nextOffset: number
  source: string
}

interface LogViewerProps {
  theme: 'light' | 'dark'
}

export function LogViewer({ theme }: LogViewerProps) {
  const themeClasses = useThemeClasses(theme)
  const source = useMemo(resolveSource, [])
  const [lines, setLines] = useState<string[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sourceLabel = LOG_SOURCES[source] ?? source

  const fetchPage = async (nextOffset = 0, append = false) => {
    const isInitial = !append
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    setError(null)

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json'
      }
      const devToken = import.meta.env.DEV ? import.meta.env.VITE_MONITOR_API_TOKEN : ''
      if (devToken) {
        headers['X-Api-Token'] = devToken
        headers['Authorization'] = `Bearer ${devToken}`
      }

      const response = await fetch(
        `${API_URL}/api/logs/${source}?limit=${DEFAULT_LIMIT}&offset=${nextOffset}&order=asc`,
        {
          headers,
          cache: 'no-store'
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const payload: LogResponse = await response.json()
      const newLines = payload.lines || []

      setLines(prev => {
        if (!append) {
          return newLines
        }
        return [...newLines, ...prev]
      })
      setOffset(payload.nextOffset ?? nextOffset + newLines.length)
      setHasMore(Boolean(payload.hasMore))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPage(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const handleRefresh = () => fetchPage(0, false)
  const handleLoadMore = () => fetchPage(offset, true)

  return (
    <div className={`animate-fade-in-up ${themeClasses.bgCard} rounded-md border-2 ${themeClasses.border} p-4`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${themeClasses.text}`}>Log: {sourceLabel}</h2>
          <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
            Mostrando del más viejo al más nuevo (lo más reciente queda abajo).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className={`${themeClasses.bgCard} ${themeClasses.text} border-2 ${themeClasses.border} hover:opacity-80 font-semibold h-8`}
            disabled={loading}
          >
            Recargar
          </Button>
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className={`${themeClasses.bgCard} ${themeClasses.text} border-2 ${themeClasses.border} hover:opacity-80 font-semibold h-8`}
            disabled={loadingMore || !hasMore}
          >
            Cargar más
          </Button>
        </div>
      </div>

      <Separator className={`my-4 opacity-50 ${themeClasses.border}`} />

      {error ? (
        <div className={`text-sm ${themeClasses.textMuted}`}>Error: {error}</div>
      ) : (
        <div className={`rounded-md border ${themeClasses.border} ${themeClasses.inputBg} p-3 text-xs ${themeClasses.text} max-h-[70vh] overflow-auto`}>
          {loading ? (
            <div className={themeClasses.textMuted}>Cargando log...</div>
          ) : (
            <pre className="whitespace-pre-wrap break-words">{lines.join('\n')}</pre>
          )}
        </div>
      )}
    </div>
  )
}
