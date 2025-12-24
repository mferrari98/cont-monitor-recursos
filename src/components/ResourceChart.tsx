import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useThemeClasses } from "@/lib/useThemeClasses"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

interface ResourceChartProps {
  title: string
  data: Array<{ time: string; value: number }>
  color: string
  unit: string
  theme: 'light' | 'dark'
}

export function ResourceChart({
  title,
  data,
  color,
  unit,
  theme
}: ResourceChartProps) {
  const themeClasses = useThemeClasses(theme)
  const isDark = theme === 'dark'

  const axisColor = isDark ? '#71717a' : '#a1a1aa'
  const gridColor = isDark ? '#27272a' : '#e4e4e7'
  const tooltipBg = isDark ? '#18181b' : '#ffffff'
  const tooltipText = isDark ? '#fafafa' : '#09090b'
  const tooltipBorder = isDark ? '#3f3f46' : '#d4d4d8'

  const baseColor = color

  return (
    <Card className={`${themeClasses.bgCard} ${themeClasses.border} border-2 animate-fade-in-up hover:shadow-lg transition-shadow duration-300`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold ${themeClasses.text}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 15, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={baseColor} stopOpacity={0.4} />
                <stop offset="50%" stopColor={baseColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grid horizontal sutil */}
            <CartesianGrid
              stroke={gridColor}
              strokeWidth={0.5}
              strokeDasharray="4 4"
              horizontal={true}
              vertical={false}
              opacity={0.3}
            />

            {/* Eje X - tiempo */}
            <XAxis
              dataKey="time"
              tick={{ fill: axisColor, fontSize: 10 }}
              stroke="none"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                const parts = value.split(':')
                return `${parts[0]}:${parts[1]}`
              }}
            />

            {/* Eje Y - porcentaje */}
            <YAxis
              tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
              stroke={axisColor}
              strokeWidth={0.5}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              width={35}
              tickMargin={8}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '12px',
                padding: '12px',
                boxShadow: isDark
                  ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                  : '0 4px 20px rgba(0, 0, 0, 0.1)',
                color: tooltipText
              }}
              formatter={(value: number | undefined) => [
                <span style={{ color: baseColor, fontWeight: 600, fontSize: '14px' }}>
                  {value ?? 0}{unit}
                </span>,
                <span style={{ color: axisColor, fontSize: '12px' }}>Uso</span>
              ]}
              labelStyle={{ color: axisColor, fontSize: '11px', fontWeight: 500 }}
              cursor={{
                stroke: baseColor,
                strokeWidth: 1,
                strokeDasharray: '4 4',
                opacity: 0.5
              }}
              animationDuration={200}
            />

            {/* Área */}
            <Area
              type="natural"
              dataKey="value"
              stroke={baseColor}
              strokeWidth={2.5}
              fill={`url(#gradient-${title})`}
              animationBegin={0}
              animationDuration={1000}
              activeDot={{
                r: 5,
                fill: baseColor,
                stroke: isDark ? '#fff' : '#fff',
                strokeWidth: 2
              }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
