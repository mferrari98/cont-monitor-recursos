import { useState, useEffect, useCallback } from "react"
import { ResourceCard } from "./ResourceCard"
import { ResourceChart } from "./ResourceChart"
import { Separator } from "@/components/ui/separator"
import { useThemeClasses } from "@/lib/useThemeClasses"
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Activity,
  AlertCircle
} from "lucide-react"

// Constantes de configuración
const DEFAULT_API_URL = 'http://localhost:3001'
const HISTORY_LENGTH = 20
const POLL_INTERVAL_MS = 5000
const UPDATE_INTERVAL_MS = 5000

interface ResourceData {
  cpu: number
  cpuLoad?: string
  memory: number
  memoryUsed?: string
  memoryTotal?: string
  disk: number
  diskUsed?: string
  diskTotal?: string
  uptime: string
}

interface HistoryData {
  cpu: Array<{ time: string; value: number }>
  memory: Array<{ time: string; value: number }>
  disk: Array<{ time: string; value: number }>
}

interface ApiResponse {
  cpu: number
  cpuLoad?: string
  memory: number
  memoryUsed?: string
  memoryTotal?: string
  disk: number
  diskUsed?: string
  diskTotal?: string
  uptime: string
  timestamp: number
}

// URL de la API del servidor
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL

// Función helper para formatear tiempo
const formatTimeLabel = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Generar datos iniciales vacíos para el historial
const generateEmptyHistory = (): HistoryData => {
  return {
    cpu: [],
    memory: [],
    disk: []
  }
}

interface ResourceMonitorProps {
  theme: 'light' | 'dark'
}

export function ResourceMonitor({ theme }: ResourceMonitorProps) {
  const themeClasses = useThemeClasses(theme)
  const [resources, setResources] = useState<ResourceData>({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: '--'
  })
  const [history, setHistory] = useState<HistoryData>(generateEmptyHistory())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener datos de la API - envuelta en useCallback
  const fetchMetrics = useCallback(async (abortSignal?: AbortSignal): Promise<ResourceData | null> => {
    try {
      const response = await fetch(`${API_URL}/api/metrics`, {
        signal: abortSignal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse = await response.json()

      return {
        cpu: data.cpu,
        cpuLoad: data.cpuLoad,
        memory: data.memory,
        memoryUsed: data.memoryUsed,
        memoryTotal: data.memoryTotal,
        disk: data.disk,
        diskUsed: data.diskUsed,
        diskTotal: data.diskTotal,
        uptime: data.uptime
      }
    } catch (error) {
      // No lanzar error si la petición fue abortada
      if (error instanceof Error && error.name === 'AbortError') {
        return null
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error fetching metrics:', errorMessage)

      // Lanzar error para que se maneje en el useEffect
      throw new Error(`Error al conectar: ${errorMessage}`)
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    const abortController = new AbortController()

    const loadInitialData = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchMetrics(abortController.signal)

        if (data) {
          setResources(data)

          // Inicializar historial con datos reales
          const now = new Date()

          setHistory({
            cpu: Array(HISTORY_LENGTH).fill(null).map((_, i) => ({
              time: formatTimeLabel(new Date(now.getTime() - (HISTORY_LENGTH - 1 - i) * UPDATE_INTERVAL_MS)),
              value: i === HISTORY_LENGTH - 1 ? data.cpu : 0
            })),
            memory: Array(HISTORY_LENGTH).fill(null).map((_, i) => ({
              time: formatTimeLabel(new Date(now.getTime() - (HISTORY_LENGTH - 1 - i) * UPDATE_INTERVAL_MS)),
              value: i === HISTORY_LENGTH - 1 ? data.memory : 0
            })),
            disk: Array(HISTORY_LENGTH).fill(null).map((_, i) => ({
              time: formatTimeLabel(new Date(now.getTime() - (HISTORY_LENGTH - 1 - i) * UPDATE_INTERVAL_MS)),
              value: i === HISTORY_LENGTH - 1 ? data.disk : 0
            }))
          })
        } else {
          setError('No se pudo conectar al servidor de métricas')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    return () => {
      abortController.abort()
    }
  }, [fetchMetrics])

  // Actualizar datos periódicamente
  useEffect(() => {
    if (loading) return

    const abortController = new AbortController()
    const intervalId = setInterval(async () => {
      try {
        const newData = await fetchMetrics(abortController.signal)

        if (newData) {
          setResources(newData)
          setError(null)

          // Actualizar historial
          const now = new Date()
          const timeLabel = formatTimeLabel(now)

          setHistory(prev => ({
            cpu: [...prev.cpu.slice(1), { time: timeLabel, value: newData.cpu }],
            memory: [...prev.memory.slice(1), { time: timeLabel, value: newData.memory }],
            disk: [...prev.disk.slice(1), { time: timeLabel, value: newData.disk }]
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      }
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
      abortController.abort()
    }
  }, [loading, fetchMetrics])

  const isDark = theme === 'dark'

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${themeClasses.textMuted}`}>
        <Activity className="w-12 h-12 animate-pulse mb-4" />
        <p>Conectando al servidor de métricas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border-2 rounded-md p-6`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              Error de conexión
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
              {error}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-red-300/70' : 'text-red-600/70'}`}>
              Asegúrate de que el servidor esté corriendo: <code className="px-1 py-0.5 rounded bg-black/10">npm run server</code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard
          title="CPU"
          value={`${resources.cpu}%`}
          percentage={resources.cpu}
          icon={Cpu}
          details={resources.cpuLoad}
          theme={theme}
          delayClass="stagger-1"
        />
        <ResourceCard
          title="Memoria RAM"
          value={`${resources.memory}%`}
          percentage={resources.memory}
          icon={MemoryStick}
          details={`${resources.memoryUsed} GB / ${resources.memoryTotal} GB`}
          theme={theme}
          delayClass="stagger-2"
        />
        <ResourceCard
          title="Disco"
          value={`${resources.disk}%`}
          percentage={resources.disk}
          icon={HardDrive}
          details={`${resources.diskUsed} GB / ${resources.diskTotal} GB`}
          theme={theme}
          delayClass="stagger-3"
        />
        <div className={`animate-fade-in-up stagger-4 ${themeClasses.bgCard} rounded-md border-2 ${themeClasses.border} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-semibold ${themeClasses.text}`}>Uptime</span>
            <div className={`p-2 rounded-md ${isDark ? 'bg-blue-400/20' : 'bg-blue-100'}`}>
              <Clock className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
          <div className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
            {resources.uptime}
          </div>
          <p className={`text-xs ${themeClasses.textMuted}`}>
            Tiempo de actividad del servidor
          </p>
        </div>
      </div>

      <Separator className={`opacity-50 ${themeClasses.border}`} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ResourceChart
          title="Historial CPU"
          data={history.cpu}
          color="#22c55e"
          unit="%"
          theme={theme}
        />
        <ResourceChart
          title="Historial Memoria"
          data={history.memory}
          color="#3b82f6"
          unit="%"
          theme={theme}
        />
        <ResourceChart
          title="Historial Disco"
          data={history.disk}
          color="#f59e0b"
          unit="%"
          theme={theme}
        />
      </div>
    </div>
  )
}
