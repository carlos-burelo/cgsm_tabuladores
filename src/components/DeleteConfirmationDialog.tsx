'use client'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteConfirmationDialogProps {
	isOpen: boolean
	title: string
	description: string
	onConfirm: () => void | Promise<void>
	onCancel: () => void
	isLoading?: boolean
}

export function DeleteConfirmationDialog({
	isOpen,
	title,
	description,
	onConfirm,
	onCancel,
	isLoading = false,
}: DeleteConfirmationDialogProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isLoading}>
						{isLoading ? 'Eliminando...' : 'Eliminar'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
