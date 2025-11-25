"use client";

import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Concept } from "@/hooks/useClassifierState";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

interface ClassifiedConceptItemProps {
	concept: Concept;
	groupName: string;
	onDelete: (groupName: string, conceptId: number) => Promise<void>;
}

export function ClassifiedConceptItem({
	concept,
	groupName,
	onDelete,
}: ClassifiedConceptItemProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleDeleteConfirm = async () => {
		setIsDeleting(true);
		try {
			await onDelete(groupName, concept.id);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<div className="p-2 bg-accent/30 rounded border border-green-600/20 space-y-1">
				<div className="flex items-start justify-between gap-2">
					<div className="text-xs text-foreground flex-1">{concept.name}</div>
					{concept.precio !== undefined && (
						<div className="text-xs font-semibold text-foreground shrink-0">
							${concept.precio.toLocaleString()}
						</div>
					)}
				</div>
				<div className="flex items-center justify-between gap-2">
					{concept.proveedor && (
						<Badge variant="secondary" className="text-xs">
							{concept.proveedor}
						</Badge>
					)}
					<Button
						onClick={() => setShowDeleteDialog(true)}
						variant="ghost"
						size="sm"
						className="h-auto p-1 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
					>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<DeleteConfirmationDialog
				isOpen={showDeleteDialog}
				title="Eliminar elemento"
				description="¿Estás seguro de que deseas eliminar este elemento de la clasificación?"
				onConfirm={handleDeleteConfirm}
				onCancel={() => setShowDeleteDialog(false)}
				isLoading={isDeleting}
			/>
		</>
	);
}
