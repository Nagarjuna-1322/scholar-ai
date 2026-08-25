"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ScholarshipChartProps {
    data: any[];
}

const chartConfig = {
  "Government": {
    label: "Government",
    color: "hsl(var(--chart-1))",
  },
  "Tech Foundation": {
    label: "Tech Foundation",
    color: "hsl(var(--chart-2))",
  },
  "WomenEd": {
    label: "WomenEd",
    color: "hsl(var(--chart-3))",
  },
  "State Govt": {
    label: "State Govt",
    color: "hsl(var(--chart-4))",
  },
  "Cultural Council": {
    label: "Cultural Council",
    color: "hsl(var(--chart-5))",
  },
  "Entrepreneurs Org": {
    label: "Entrepreneurs Org",
    color: "hsl(var(--chart-6))",
  },
} satisfies ChartConfig

export function ScholarshipChart({ data }: ScholarshipChartProps) {
  return (
      <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
        <BarChart data={data} accessibilityLayer>
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="Government" stackId="a" fill="var(--color-Government)" radius={0} />
          <Bar dataKey="Tech Foundation" stackId="a" fill="var(--color-Tech Foundation)" radius={0} />
          <Bar dataKey="WomenEd" stackId="a" fill="var(--color-WomenEd)" radius={0} />
          <Bar dataKey="State Govt" stackId="a" fill="var(--color-State Govt)" radius={0} />
          <Bar dataKey="Cultural Council" stackId="a" fill="var(--color-Cultural Council)" radius={0} />
          <Bar dataKey="Entrepreneurs Org" stackId="a" fill="var(--color-Entrepreneurs Org)" radius={4} />
        </BarChart>
      </ChartContainer>
  )
}
