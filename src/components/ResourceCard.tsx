import { LucideIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useThemeClasses } from "@/lib/useThemeClasses"

interface ResourceCardProps {
  title: string
  value: string
  percentage: number
  icon: LucideIcon
  details?: string
  theme: 'light' | 'dark'
  delayClass?: string
}

const getColorClass = (percentage: number, isDark: boolean) => {
  if (percentage >= 80) return {
    text: isDark ? 'text-red-400' : 'text-red-600',
    bg: isDark ? 'bg-red-500/20' : 'bg-red-100',
    bgBar: 'bg-gradient-to-r from-red-500 to-red-400',
    indicator: '⚠️'
  }
  if (percentage >= 60) return {
    text: isDark ? 'text-yellow-400' : 'text-yellow-600',
    bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100',
    bgBar: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    indicator: '⚡'
  }
  return {
    text: isDark ? 'text-green-400' : 'text-green-600',
    bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
    bgBar: 'bg-gradient-to-r from-green-500 to-green-400',
    indicator: '✓'
  }
}

export function ResourceCard({
  title,
  value,
  percentage,
  icon: Icon,
  details,
  theme,
  delayClass = ''
}: ResourceCardProps) {
  const themeClasses = useThemeClasses(theme)
  const isDark = theme === 'dark'
  const colors = getColorClass(percentage, isDark)

  return (
    <Card className={`animate-fade-in-up ${delayClass} ${themeClasses.bgCard} ${themeClasses.border} border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-semibold ${themeClasses.text}`}>
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colors.bg} transition-all duration-300`}>
              <Icon className={`w-4 h-4 ${colors.text}`} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold tracking-tight ${themeClasses.text}`}>
              {value}
            </span>
          </div>

          {/* Progress Bar con gradiente y animación */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={themeClasses.textMuted}>Uso</span>
              <span className={themeClasses.textMuted}>{percentage > 100 ? 100 : percentage}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800/50' : 'bg-gray-200'} relative`}>
              {/* Barra de fondo con gradiente */}
              <div
                className={`h-full rounded-full ${colors.bgBar} transition-all duration-700 ease-out relative overflow-hidden`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              >
                {/* Efecto de brillo en la barra */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {details && (
            <p className={`text-sm font-medium ${themeClasses.text} flex items-center gap-1`}>
              {details}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
