'use client';

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Concept } from '@/hooks/useClassifierState'
import { CheckCircleIcon } from 'lucide-react'

interface UnclassifiedConceptsListProps {
  concepts: Concept[];
  isLoading: boolean;
  filter: string;
  onFilterChange: (value: string) => void;
  sortBy: 'name' | 'price-asc' | 'price-desc';
  onSortChange: (value: 'name' | 'price-asc' | 'price-desc') => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  getFilteredAndSortedConcepts: () => Concept[];
}

export function UnclassifiedConceptsList({
  isLoading,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  selectedIds,
  onToggleSelect,
  getFilteredAndSortedConcepts,
  concepts,
}: UnclassifiedConceptsListProps) {
  const filteredConcepts = getFilteredAndSortedConcepts();

  return (
    <div>
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar conceptos..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">
            Conceptos sin Clasificar ({concepts.length})
          </h2>
          <div className="shrink-0">
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="price-asc">Precio ↑</SelectItem>
                <SelectItem value="price-desc">Precio ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-lg p-3 bg-background">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-foreground mx-auto mb-2"></div>
              <p className="text-muted-foreground">Cargando conceptos...</p>
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              {concepts.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  <p>Todos los conceptos están clasificados</p>
                </div>
              ) : (
                <p>No hay resultados</p>
              )}
            </div>
          ) : (
            filteredConcepts.map((concept) => (
              <label
                key={concept.id}
                className="flex items-center gap-2 p-3 bg-secondary/30 rounded hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(concept.id)}
                  onChange={() => onToggleSelect(concept.id)}
                  className="w-4 h-4 rounded border-input cursor-pointer shrink-0"
                />
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <span className="text-sm">{concept.name}</span>
                  {concept.precio !== undefined && (
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">
                      ${concept.precio}
                    </span>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {concept.proveedor}
                </Badge>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
