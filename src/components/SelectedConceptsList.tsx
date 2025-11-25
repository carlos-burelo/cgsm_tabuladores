'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SelectedConceptItem } from './SelectedConceptItem';
import type { Concept } from '@/hooks/useClassifierState';

interface SelectedConceptsListProps {
  selectedIds: Set<number>;
  concepts: Concept[];
  standardName: string;
  onStandardNameChange: (value: string) => void;
  isSaving: boolean;
  onSaveClassification: () => void;
  onRemoveSelected: (id: number) => void;
}

export function SelectedConceptsList({
  selectedIds,
  concepts,
  standardName,
  onStandardNameChange,
  isSaving,
  onSaveClassification,
  onRemoveSelected,
}: SelectedConceptsListProps) {
  if (selectedIds.size === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        Sin conceptos seleccionados
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Classification Form */}
      <div className="p-3 border border-primary/20 rounded-lg bg-accent/30">
        <h4 className="text-xs font-semibold text-foreground mb-2">
          Clasificar Seleccionados
        </h4>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Nombre estándar..."
            value={standardName}
            onChange={(e) => onStandardNameChange(e.target.value)}
          />
          <Button
            onClick={onSaveClassification}
            disabled={isSaving || selectedIds.size === 0 || !standardName.trim()}
            size="sm"
            className="w-full"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Selected Items List */}
      <div className="space-y-2">
        {Array.from(selectedIds).map((id) => {
          const concept = concepts.find((c) => c.id === id);
          return (
            <SelectedConceptItem
              key={id}
              concept={concept}
              onRemove={() => onRemoveSelected(id)}
            />
          );
        })}
      </div>
    </div>
  );
}
