'use client'

import { max, scaleBand, scaleLinear } from 'd3'
import type { CSSProperties } from 'react'
import type { ComparisonResult } from '@/types/service'

interface ComparisonChartProps {
	data: ComparisonResult
}

const barColors = [
	'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
	'from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600',
	'from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600',
	'from-green-400 to-green-500 hover:from-green-500 hover:to-green-600',
	'from-indigo-400 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600',
	'from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600',
	'from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600',
	'from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600',
]

export default function ComparisonChart({ data }: ComparisonChartProps) {
	const chartData = data.servicios.map((s) => ({
		key: s.proveedor,
		value: s.precio,
	}))

	const xScale = scaleBand()
		.domain(chartData.map((d) => d.key))
		.range([0, 100])
		.padding(0.2)

	const yMax = max(chartData.map((d) => d.value)) ?? 0
	const yScale = scaleLinear()
		.domain([0, yMax * 1.1])
		.range([100, 0])

	// Altura del gráfico adaptativa según cantidad de items
	const chartHeight = Math.max(250, Math.ceil(chartData.length / 5) * 80 + 80)

	// Márgenes adaptativos para pantallas pequeñas
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
	const marginValues = {
		'--marginTop': isMobile ? '12px' : '20px',
		'--marginRight': isMobile ? '20px' : '40px',
		'--marginBottom': isMobile ? '50px' : '40px',
		'--marginLeft': isMobile ? '12px' : '20px',
	} as CSSProperties

	return (
		<div
			className='relative w-full rounded-lg sm:rounded-xl border border-accent overflow-hidden'
			style={marginValues}
		>
			<div style={{ height: `${chartHeight}px` }} className='relative'>
				<div
					className='absolute inset-0
            h-[calc(100%-var(--marginTop)-var(--marginBottom))]
            w-[calc(100%-var(--marginLeft)-var(--marginRight))]
            translate-x-(--marginLeft)
            translate-y-(--marginTop)
            overflow-visible
          '
				>
					<svg
						viewBox='0 0 100 100'
						className='overflow-visible w-full h-full'
						preserveAspectRatio='none'
					>
						<title className='sr-only'>Comparison Chart</title>
						{/* Grid lines */}
						{yScale
							.ticks(6)
							.map(yScale.tickFormat(6, '.0f'))
							.map((active, i) => (
								<g
									transform={`translate(0,${yScale(+active)})`}
									className='text-muted-foreground/70'
									key={i}
								>
									<line
										x1={0}
										x2={100}
										stroke='currentColor'
										strokeDasharray='4,3'
										strokeWidth={0.5}
										vectorEffect='non-scaling-stroke'
									/>
								</g>
							))}

						<line
							x1={0}
							x2={100}
							y1={100}
							y2={100}
							stroke='currentColor'
							strokeWidth={1}
							vectorEffect='non-scaling-stroke'
							className='text-foreground'
						/>
					</svg>

					{chartData.map((d, index) => {
						const barWidth = xScale.bandwidth()
						const barHeight = yScale(0) - yScale(d.value)
						const xPosition = xScale(d.key)
						const colorClass = barColors[index % barColors.length]

						return (
							<div
								key={index}
								style={{
									width: `${barWidth}%`,
									height: `${barHeight}%`,
									marginLeft: `${xPosition}%`,
								}}
								className={`absolute bottom-0 bg-linear-to-b rounded-t-lg transition-colors cursor-pointer group ${colorClass}`}
								title={`${d.key}: $${d.value.toLocaleString()}`}
							>
								<div className='absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs sm:text-sm font-bold text-accent-foreground px-2 sm:px-3 py-1 sm:py-2'>
									${d.value.toLocaleString()}
								</div>
							</div>
						)
					})}

					{/* X Axis Labels */}
					{chartData.map((entry, i) => {
						const xPosition = xScale(entry.key)! + xScale.bandwidth() / 2

						return (
							<div
								key={i}
								className='absolute overflow-visible'
								style={{
									left: `${xPosition}%`,
									top: '100%',
								}}
							>
								<div className='text-xs text-accent-foreground font-medium translate-y-1 sm:translate-y-2 -translate-x-1/2 max-w-[60px] sm:max-w-20 text-center wrap-break-words leading-tight'>
									{entry.key}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
