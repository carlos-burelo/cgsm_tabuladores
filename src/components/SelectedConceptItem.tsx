'use client'

import { Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Concept } from '@/hooks/useClassifierState'

interface SelectedConceptItemProps {
	concept: Concept | undefined
	onRemove: () => void
}

export function SelectedConceptItem({ concept, onRemove }: SelectedConceptItemProps) {
	if (!concept) return null

	return (
		<div className='p-3 bg-accent/30 rounded border border-primary/20 space-y-2'>
			<div className='flex items-start justify-between gap-2'>
				<span className='text-xs flex-1 text-foreground wrap-break-words'>{concept.name}</span>
				<Button
					onClick={onRemove}
					variant='ghost'
					size='sm'
					className='h-auto p-0 text-primary hover:text-primary shrink-0'
					title='Remover de selección'
				>
					<Trash2Icon className='h-4 w-4' />
				</Button>
			</div>
			{concept.proveedor && <Badge variant='secondary'>{concept.proveedor}</Badge>}
		</div>
	)
}
