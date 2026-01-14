import express from 'express'
import cors from 'cors'
import si from 'systeminformation'

const app = express()
app.set('trust proxy', 1) // Trust first proxy for real client IPs
app.disable('x-powered-by')

app.use((req, res, next) => {
  res.set('X-Frame-Options', 'SAMEORIGIN')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Referrer-Policy', 'no-referrer')
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

const PORT = 3001

const rawToken = process.env.MONITOR_API_TOKEN || ''
const API_TOKEN = rawToken.trim()
const HAS_API_TOKEN = Boolean(API_TOKEN)

if (!HAS_API_TOKEN && process.env.NODE_ENV !== 'development') {
  console.warn('[WARN] MONITOR_API_TOKEN no configurado. La API queda sin token.')
}

function requireApiToken(req, res, next) {
  const remoteAddress = req.socket?.remoteAddress || req.connection?.remoteAddress || ''
  const isLocal = remoteAddress === '127.0.0.1' || remoteAddress === '::1'

  if (isLocal && process.env.NODE_ENV === 'development') {
    return next()
  }

  const authUser = req.header('X-Auth-User') || ''
  if (authUser) {
    return next()
  }

  if (!HAS_API_TOKEN) {
    return res.status(503).json({
      error: 'Unauthorized',
      message: 'MONITOR_API_TOKEN no configurado'
    })
  }

  const tokenHeader = req.header('X-Api-Token') || ''
  const authHeader = req.header('Authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (tokenHeader !== API_TOKEN && bearer !== API_TOKEN) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token invalido'
    })
  }

  return next()
}

// Rate limiting simple en memoria para prevenir abusos
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 peticiones por minuto
const RATE_LIMIT_CLEANUP_INTERVAL = 60000

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now >= value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, RATE_LIMIT_CLEANUP_INTERVAL).unref()

function checkRateLimit(req) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()

  const record = rateLimitMap.get(ip) || {
    count: 0,
    resetAt: now + RATE_LIMIT_WINDOW
  }

  if (now >= record.resetAt) {
    record.count = 0
    record.resetAt = now + RATE_LIMIT_WINDOW
  }

  record.count++
  rateLimitMap.set(ip, record)

  return {
    allowed: record.count <= RATE_LIMIT_MAX_REQUESTS,
    retryAfter: Math.max(0, Math.ceil((record.resetAt - now) / 1000))
  }
}

// Middleware de rate limiting
function rateLimitMiddleware(req, res, next) {
  const result = checkRateLimit(req)
  if (!result.allowed) {
    res.set('Retry-After', String(result.retryAfter))
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Has excedido el límite de peticiones. Por favor espera un momento.',
      retryAfter: result.retryAfter
    })
  }
  next()
}

// Configuración de CORS con orígenes permitidos
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://10.10.9.246:5173',
  'http://10.10.9.246:5174'
]
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || ''
const envAllowedOrigins = rawAllowedOrigins
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const allowedOriginsList = envAllowedOrigins.length > 0
  ? envAllowedOrigins
  : (process.env.NODE_ENV === 'development' ? DEFAULT_ALLOWED_ORIGINS : [])
const ALLOWED_ORIGINS = new Set(allowedOriginsList)

if (ALLOWED_ORIGINS.size === 0 && process.env.NODE_ENV !== 'development') {
  console.warn('[WARN] ALLOWED_ORIGINS vacío. CORS bloqueará orígenes de navegador.')
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origen (curl, Postman, apps móviles)
    if (!origin) return callback(null, true)

    if (ALLOWED_ORIGINS.has(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Origen no permitido por CORS'))
    }
  },
  credentials: false,
  methods: ['GET']
}))

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Cache para métricas - evita llamadas excesivas a systeminformation
const CACHE_TTL = 2500 // 2.5 segundos
let metricsCache = {
  data: null,
  timestamp: 0
}

// Función para calcular métricas del sistema
async function calculateMetrics() {
  // Obtener métricas - currentLoad, mem, y fsSize son asíncronos
  const [cpuLoad, mem, fsSize] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize()
  ])

  // time() es síncrono y devuelve uptime directamente
  const uptimeSeconds = si.time().uptime
  const uptime = formatUptime(uptimeSeconds)

  // Calcular porcentaje de CPU
  const cpuUsage = cpuLoad.currentLoad

  // Memoria: calcular porcentaje y valores absolutos en GB
  const memoryUsedBytes = mem.total - mem.available
  const memoryUsedGB = (memoryUsedBytes / (1024 ** 3)).toFixed(1)
  const memoryTotalGB = (mem.total / (1024 ** 3)).toFixed(1)
  const memoryUsedPercent = (memoryUsedBytes / mem.total) * 100

  // Disco: calcular porcentaje y valores absolutos en GB
  const mainDisk = fsSize.find(d => d.mount === '/') || fsSize[0]
  const diskUsedGB = mainDisk ? ((mainDisk.size - mainDisk.available) / (1024 ** 3)).toFixed(1) : '0'
  const diskTotalGB = mainDisk ? (mainDisk.size / (1024 ** 3)).toFixed(1) : '0'
  const diskUsedPercent = mainDisk ? mainDisk.use : 0

  // CPU: formato con carga actual
  const cpuCores = cpuLoad.cpus?.length || 0
  const cpuLoadText = `${cpuUsage.toFixed(1)}%${cpuCores > 0 ? ` (${cpuCores} cores)` : ''}`

  return {
    cpu: Math.round(cpuUsage),
    cpuLoad: cpuLoadText,
    memory: Math.round(memoryUsedPercent),
    memoryUsed: memoryUsedGB,
    memoryTotal: memoryTotalGB,
    disk: Math.round(diskUsedPercent),
    diskUsed: diskUsedGB,
    diskTotal: diskTotalGB,
    uptime: uptime,
    timestamp: Date.now()
  }
}

// Endpoint: Obtener todas las métricas actuales
app.get('/api/metrics', rateLimitMiddleware, requireApiToken, async (req, res) => {
  try {
    const now = Date.now()

    // Verificar si hay datos en cache válidos
    if (metricsCache.data && (now - metricsCache.timestamp) < CACHE_TTL) {
      // Retornar datos cacheados
      return res.json(metricsCache.data)
    }

    // Cache expirado o no existe - calcular nuevas métricas
    const data = await calculateMetrics()

    // Actualizar cache
    metricsCache = {
      data: data,
      timestamp: now
    }

    res.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error obteniendo métricas:', errorMessage)

    res.status(500).json({
      error: 'Error obteniendo métricas del sistema',
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    })
  }
})

// Endpoint: Obtener historial (opcional - para persistencia futura)
app.get('/api/metrics/history', rateLimitMiddleware, requireApiToken, async (req, res) => {
  // Validar y sanitizar el parámetro limit (entre 1 y 100)
  const rawLimit = parseInt(req.query.limit, 10)
  const isValidLimit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100
  const limit = isValidLimit ? rawLimit : 20

  // Por ahora retornamos datos vacíos ya que no persistemos
  res.json({
    cpu: [],
    memory: [],
    disk: [],
    limit
  })
})

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Ruta API desconocida'
  })
})

// Health check
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  if (err instanceof Error && err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({
      error: 'CORS forbidden',
      message: 'Origen no permitido por CORS'
    })
  }

  next(err)
})

// Formatear uptime a formato legible
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const HOST = '0.0.0.0' // Escuchar en todas las interfaces

app.listen(PORT, HOST, () => {
  console.log(`Servidor de métricas corriendo en http://${HOST}:${PORT}`)
  console.log(`Endpoints disponibles:`)
  console.log(`  - GET /api/metrics      - Métricas actuales del sistema`)
  console.log(`  - GET /health           - Health check`)
})
