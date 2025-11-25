'use client';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClassifiedGroupItem } from './ClassifiedGroupItem';
import type { ClassifiedGroup } from '@/hooks/useClassifiedConcepts';

interface ClassifiedConceptsListProps {
  groups: ClassifiedGroup[];
  isLoading: boolean;
  filterInput: string;
  onFilterChange: (value: string) => void;
  expandedGroup: string | null;
  onExpandChange: (groupName: string | null) => void;
  onDeleteItem: (groupName: string, conceptId: number) => Promise<void>;
}

export function ClassifiedConceptsList({
  groups,
  isLoading,
  filterInput,
  onFilterChange,
  expandedGroup,
  onExpandChange,
  onDeleteItem,
}: ClassifiedConceptsListProps) {
  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Search input - Always visible */}
      <Input
        type="text"
        placeholder="Buscar clasificados..."
        value={filterInput}
        onChange={(e) => onFilterChange(e.target.value)}
      />

      {/* Content area with ScrollArea */}
      <ScrollArea className="flex-1">
        <div className="pr-4">
          {isLoading && groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-foreground mx-auto mb-2"></div>
              <p className="text-muted-foreground text-xs">Cargando clasificados...</p>
            </div>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {filterInput.trim() ? 'No hay resultados' : 'Sin clasificaciones aún'}
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <ClassifiedGroupItem
                  key={group.standardName}
                  group={group}
                  isExpanded={expandedGroup === group.standardName}
                  onExpandChange={(open) =>
                    onExpandChange(open ? group.standardName : null)
                  }
                  onDeleteItem={onDeleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
