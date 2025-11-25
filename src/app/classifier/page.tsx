'use client'

import { toast } from 'sonner'
import { ConceptsSidebar } from '@/components/ConceptsSidebar'
import { Header } from '@/components/SearchPageHeader'
import { UnclassifiedConceptsList } from '@/components/UnclassifiedConceptsList'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useClassifiedConcepts } from '@/hooks/useClassifiedConcepts'
import { useClassifierState } from '@/hooks/useClassifierState'
import { saveConceptClassificationAction } from '@/lib/actions'

export default function ClassifierPage() {
	const unclassified = useClassifierState()
	const classified = useClassifiedConcepts(unclassified.selectedServiceType || undefined)

	const handleSaveClassification = async () => {
		if (unclassified.selectedIds.size === 0) {
			toast.error('Selecciona al menos un concepto')
			return
		}

		if (!unclassified.standardName.trim()) {
			toast.error('Ingresa un nombre estándar')
			return
		}

		unclassified.setIsSaving(true)
		try {
			const result = await saveConceptClassificationAction(
				Array.from(unclassified.selectedIds),
				unclassified.standardName.trim(),
			)

			if (result.success) {
				const newConcepts = unclassified.concepts.filter((c) => !unclassified.selectedIds.has(c.id))
				unclassified.setConcepts(newConcepts)

				const newGroup = {
					standardName: unclassified.standardName.trim(),
					concepts: unclassified.concepts.filter((c) => unclassified.selectedIds.has(c.id)),
				}

				classified.setClassifiedGroups([...classified.classifiedGroups, newGroup])
				unclassified.setSelectedIds(new Set())
				unclassified.setStandardName('')
				toast.success(result.message)
			} else {
				toast.error(result.message)
			}
		} finally {
			unclassified.setIsSaving(false)
		}
	}

	return (
		<main className='w-full h-screen bg-muted/30 grid grid-rows-[auto_auto_1fr]'>
			<Header />
			<div className='border-b border-border bg-background px-4 sm:px-6 py-3'>
				<div className='max-w-7xl mx-auto'>
					<div className='flex items-center gap-3'>
						<label
							htmlFor='service-type'
							className='text-sm font-semibold text-foreground whitespace-nowrap'
						>
							Filtrar por:
						</label>
						<Select
							name='service-type'
							value={String(unclassified.selectedServiceType || '')}
							onValueChange={(value) => unclassified.setSelectedServiceType(Number(value))}
						>
							<SelectTrigger className='w-48'>
								<SelectValue placeholder='-- Selecciona un tipo --' />
							</SelectTrigger>
							<SelectContent>
								{unclassified.serviceTypes.map((type) => (
									<SelectItem key={type.id} value={String(type.id)}>
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-[1fr_24rem] relative overflow-hidden'>
				<div className='bg-background'>
					<div className='max-w-full'>
						<div className='h-full'>
							<UnclassifiedConceptsList
								concepts={unclassified.concepts}
								isLoading={unclassified.isLoading}
								filter={unclassified.filter}
								onFilterChange={unclassified.setFilter}
								sortBy={unclassified.sortBy}
								onSortChange={unclassified.setSortBy}
								selectedIds={unclassified.selectedIds}
								onToggleSelect={unclassified.toggleSelect}
								getFilteredAndSortedConcepts={unclassified.getFilteredAndSortedConcepts}
							/>
						</div>
					</div>
				</div>

				<ConceptsSidebar
					selectedIds={unclassified.selectedIds}
					concepts={unclassified.concepts}
					standardName={unclassified.standardName}
					onStandardNameChange={unclassified.setStandardName}
					isSaving={unclassified.isSaving}
					onSaveClassification={handleSaveClassification}
					onToggleSelect={unclassified.toggleSelect}
					classifiedGroups={classified.classifiedGroups}
					isLoadingClassified={classified.isLoadingClassified}
					classifiedFilterInput={classified.classifiedFilterInput}
					onClassifiedFilterChange={classified.setClassifiedFilterInput}
					expandedGroup={classified.expandedGroup}
					onExpandedGroupChange={classified.setExpandedGroup}
					onDeleteClassifiedItem={classified.deleteClassifiedItem}
					sidebarTab={classified.sidebarTab}
					onSidebarTabChange={classified.setSidebarTab}
				/>
			</div>
		</main>
	)
}
