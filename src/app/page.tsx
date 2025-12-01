'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SearchBar } from '@/components/SearchBar'
import { SearchEmptyStates } from '@/components/SearchEmptyStates'
import { Header } from '@/components/SearchPageHeader'
import { SearchResults } from '@/components/SearchResults'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSearch } from '@/hooks/useSearch'
import { getServiceTypesAction } from '@/lib/actions'



interface ServiceType {
	id: number
	name: string
	description?: string | null
}

export default function Home() {
	const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
	const [selectedServiceType, setSelectedServiceType] = useState<number | null>(null)
	const [isLoadingTypes, setIsLoadingTypes] = useState(true)

	useEffect(() => {
		const loadServiceTypes = async () => {
			try {
				const types = await getServiceTypesAction()
				setServiceTypes(types)
				if (types.length > 0) {
					setSelectedServiceType(types[0].id)
				}
			} catch (error) {
				console.error('Error loading service types:', error)
				toast.error('Error al cargar tipos de servicio')
			} finally {
				setIsLoadingTypes(false)
			}
		}
		loadServiceTypes()
	}, [])

	const { search, setSearch, results, isPending } = useSearch(selectedServiceType || undefined)

	return (
		<>
			<Header />
			<SearchBar
				value={search}
				onChange={setSearch}
				serviceTypes={serviceTypes}
				selectedServiceType={selectedServiceType}
				onServiceTypeChange={setSelectedServiceType}
				isLoadingTypes={isLoadingTypes}
			/>
			<ScrollArea className='w-full overflow-hidden'>
				<div className='w-full max-w-4xl mx-auto '>
					{search && results.length > 0 && (
						<SearchResults results={results} isPending={isPending} />
					)}

					<SearchEmptyStates
						hasSearch={search.length > 0}
						isPending={isPending}
						hasResults={results.length > 0}
					/>
				</div>
			</ScrollArea>
		</>
	)
}
