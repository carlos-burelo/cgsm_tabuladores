'use client';

import { SearchIcon } from 'lucide-react';

interface SearchEmptyStatesProps {
  hasSearch: boolean;
  isPending: boolean;
  hasResults: boolean;
}

export function SearchEmptyStates({
  hasSearch,
  isPending,
  hasResults,
}: SearchEmptyStatesProps) {
  if (!isPending && hasSearch && !hasResults) {
    return (
      <div className="flex items-center justify-center min-h-full sm:min-h-80">
        <p className="text-center text-muted-foreground text-sm sm:text-base px-4">
          No se encontraron resultados
        </p>
      </div>
    );
  }

  if (isPending && !hasResults) {
    return (
      <div className="flex items-center justify-center min-h-64 sm:min-h-80 md:min-h-96">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-2 border-muted border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Buscando...</p>
        </div>
      </div>
    );
  }
  if (!hasSearch && !isPending) {
    return (
      <div className="flex items-center justify-center min-h-full sm:min-h-80 md:min-h-96">
        <div className="text-center px-4">
          <div className="mb-4">
            <SearchIcon className="h-12 sm:h-16 md:h-20 w-12 sm:w-16 md:w-20 text-muted-foreground mx-auto" />
          </div>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Comienza a buscar un servicio
          </p>
        </div>
      </div>
    );
  }

  return null;
}
