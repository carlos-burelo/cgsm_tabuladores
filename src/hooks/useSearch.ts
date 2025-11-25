import { useEffect, useRef, useState, useTransition } from 'react'
import { searchServicesAction } from '@/lib/actions'
import type { ComparisonResult } from '@/types/service'

export function useSearch(serviceTypeId?: number) {
	const [search, setSearch] = useState('')
	const [results, setResults] = useState<ComparisonResult[]>([])
	const [isPending, startTransition] = useTransition()
	const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

	useEffect(() => {
		// Limpiar timeout anterior
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current)
		}

		// No buscar si tiene menos de 3 caracteres
		if (search.length < 3) {
			setResults([])
			return
		}

		// Establecer nuevo timeout con debounce de 200ms
		debounceTimeoutRef.current = setTimeout(() => {
			startTransition(async () => {
				const searchResults = await searchServicesAction(search, serviceTypeId)
				setResults(searchResults)
			})
		}, 200)

		// Limpiar timeout al desmontar
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
			}
		}
	}, [search, serviceTypeId])

	return {
		search,
		setSearch,
		results,
		isPending,
	}
}
