import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@spree/dashboard-ui/ui/chart'
import type { Meta, StoryObj } from '@storybook/react-vite'
// The Storybook package does not depend on Recharts, so the story draws with
// the design system's own copy, the one `ChartContainer` itself imports.
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
} from '../../../../../dashboard-ui/node_modules/recharts'

interface Point {
  bucket: string
  current: number
  previous: number
}

/** Sales per day over two weeks, with the two weeks before them. */
const fortnight: Point[] = Array.from({ length: 14 }, (_, index) => {
  const day = new Date(Date.UTC(2026, 8, 18 + index))
  const weekend = [0, 6].includes(day.getUTCDay())
  return {
    bucket: day.toISOString().slice(0, 10),
    current: 180 + ((index * 53) % 140) + (weekend ? 160 : 0),
    previous: 150 + ((index * 41) % 120) + (weekend ? 90 : 0),
  }
})

const label = (bucket: string) =>
  new Date(`${bucket}T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

const config: ChartConfig = {
  current: { label: 'Total sales', color: 'var(--chart-2)' },
  previous: { label: 'Previous period', color: 'var(--muted-foreground)' },
}

/**
 * Daily figures drawn as the home page and a report draw them (DA-HOME-01,
 * DA-RPT-02, DA-RPT-03): bars for the period, a dashed line for the period
 * before when comparing, and the chart's tooltip on the day under the pointer.
 * The width is the home page's chart at 1280 pixels. The bars and line are
 * drawn without their entrance animation, so a capture shows them in place.
 */
function DailyChart({
  data,
  compare = false,
  tooltipAt,
}: {
  data: Point[]
  compare?: boolean
  /** Shows the tooltip on this day, as hovering it does. */
  tooltipAt?: number
}) {
  return (
    <div style={{ width: 917 }}>
      <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
        <ComposedChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={label}
          />
          <ChartTooltip
            cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
            defaultIndex={tooltipAt}
            isAnimationActive={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value: string) =>
                  new Date(`${value}T00:00:00Z`).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })
                }
              />
            }
          />
          <Bar
            dataKey="current"
            fill="var(--color-current)"
            opacity={0.8}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          {compare && (
            <Line
              dataKey="previous"
              stroke="var(--color-previous)"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              dot={false}
              type="monotone"
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Chart',
  component: DailyChart,
  tags: ['CMP-DUI-P-10'],
  args: { data: fortnight },
} satisfies Meta<typeof DailyChart>

export default meta
type Story = StoryObj<typeof meta>

export const ThisPeriod: Story = { name: 'This period' }

export const Compared: Story = {
  name: 'Compared with the period before',
  args: { compare: true },
}

export const Tooltip: Story = {
  name: 'Tooltip on a day',
  args: { compare: true, tooltipAt: 9 },
}

export const NoFigures: Story = {
  name: 'No figures for the period',
  args: {
    compare: true,
    data: fortnight.map((point) => ({ ...point, current: 0, previous: 0 })),
  },
}
