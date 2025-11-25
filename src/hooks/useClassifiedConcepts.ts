import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { deleteClassifiedItemAction, getClassifiedConceptsAction } from '@/lib/actions'
import type { Concept } from './useClassifierState'

export interface ClassifiedGroup {
	standardName: string
	concepts: Concept[]
}

export function useClassifiedConcepts(serviceTypeId?: number) {
	const [classifiedGroups, setClassifiedGroups] = useState<ClassifiedGroup[]>([])
	const [isLoadingClassified, setIsLoadingClassified] = useState(false)
	const [classifiedFilterInput, setClassifiedFilterInput] = useState('')
	const [classifiedFilter, setClassifiedFilter] = useState('')
	const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
	const [sidebarTab, setSidebarTab] = useState<'selected' | 'classified'>('selected')
	const classifiedFilterDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

	// Debounce para el buscador de clasificados
	useEffect(() => {
		if (classifiedFilterDebounceRef.current) {
			clearTimeout(classifiedFilterDebounceRef.current)
		}

		if (classifiedFilterInput.length < 3 && classifiedFilterInput.length > 0) {
			return
		}

		classifiedFilterDebounceRef.current = setTimeout(() => {
			setClassifiedFilter(classifiedFilterInput)
		}, 200)

		return () => {
			if (classifiedFilterDebounceRef.current) {
				clearTimeout(classifiedFilterDebounceRef.current)
			}
		}
	}, [classifiedFilterInput])

	const loadClassifiedConcepts = async (searchQuery: string, serviceTypeId?: number) => {
		if (!searchQuery.trim()) {
			setClassifiedGroups([])
			return
		}

		setIsLoadingClassified(true)
		try {
			const classified = await getClassifiedConceptsAction(searchQuery, serviceTypeId)
			setClassifiedGroups(classified)
		} catch (error) {
			console.error('Error loading classified concepts:', error)
			toast.error('Error al cargar conceptos clasificados')
		} finally {
			setIsLoadingClassified(false)
		}
	}

	const deleteClassifiedItem = async (groupName: string, conceptId: number) => {
		try {
			const result = await deleteClassifiedItemAction(conceptId)
			if (result.success) {
				setClassifiedGroups((prevGroups) =>
					prevGroups
						.map((group) => {
							if (group.standardName === groupName) {
								return {
									...group,
									concepts: group.concepts.filter((c) => c.id !== conceptId),
								}
							}
							return group
						})
						.filter((group) => group.concepts.length > 0),
				)
				toast.success(result.message)
			} else {
				toast.error(result.message)
			}
		} catch (error) {
			console.error('Error deleting classified item:', error)
			toast.error('Error al eliminar el elemento')
		}
	}
	// Cargar clasificados cuando el filtro o serviceTypeId cambian
	useEffect(() => {
		loadClassifiedConcepts(classifiedFilter, serviceTypeId)
	}, [classifiedFilter, serviceTypeId])

	return {
		classifiedGroups,
		setClassifiedGroups,
		isLoadingClassified,
		classifiedFilterInput,
		setClassifiedFilterInput,
		classifiedFilter,
		expandedGroup,
		setExpandedGroup,
		sidebarTab,
		setSidebarTab,
		deleteClassifiedItem,
	}
}
