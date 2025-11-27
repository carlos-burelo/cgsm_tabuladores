'use client'

import ComparisonChart from '@/components/ComparisonChart'
import type { ComparisonResult } from '@/types/service'

interface SearchResultsProps {
	results: ComparisonResult[]
	isPending: boolean
}

export function SearchResults({ results, isPending }: SearchResultsProps) {
	return (
		<div
			className={`space-y-12 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}
		>
			{results.map((service, index) => (
				<div key={index}>
					<div className='mb-4 sm:mb-6'>
						<h2 className='text-xl sm:text-2xl md:text-3xl font-semibold text-foreground wrap-break-words'>
							{service.nombreEstandar}
						</h2>
					</div>
					<ComparisonChart data={service} />
				</div>
			))}
			{isPending && (
				<div className='flex items-center gap-2 text-sm text-muted-foreground'>
					<div className='animate-pulse h-2 w-2 bg-primary rounded-full'></div>
					<span>Actualizando</span>
				</div>
			)}
		</div>
	)
}
