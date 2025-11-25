'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectedConceptsList } from './SelectedConceptsList';
import { ClassifiedConceptsList } from './ClassifiedConceptsList';
import type { Concept } from '@/hooks/useClassifierState';
import type { ClassifiedGroup } from '@/hooks/useClassifiedConcepts';

interface ConceptsSidebarProps {
  selectedIds: Set<number>;
  concepts: Concept[];
  standardName: string;
  onStandardNameChange: (value: string) => void;
  isSaving: boolean;
  onSaveClassification: () => void;
  onToggleSelect: (id: number) => void;
  classifiedGroups: ClassifiedGroup[];
  isLoadingClassified: boolean;
  classifiedFilterInput: string;
  onClassifiedFilterChange: (value: string) => void;
  expandedGroup: string | null;
  onExpandedGroupChange: (groupName: string | null) => void;
  onDeleteClassifiedItem: (groupName: string, conceptId: number) => Promise<void>;
  sidebarTab: 'selected' | 'classified';
  onSidebarTabChange: (tab: 'selected' | 'classified') => void;
}

export function ConceptsSidebar({
  selectedIds,
  concepts,
  standardName,
  onStandardNameChange,
  isSaving,
  onSaveClassification,
  onToggleSelect,
  classifiedGroups,
  isLoadingClassified,
  classifiedFilterInput,
  onClassifiedFilterChange,
  expandedGroup,
  onExpandedGroupChange,
  onDeleteClassifiedItem,
  sidebarTab,
  onSidebarTabChange,
}: ConceptsSidebarProps) {
  return (
    <div className="hidden lg:flex w-96 h-screen bg-background border-l border-border flex-col">
      <Tabs
        value={sidebarTab}
        onValueChange={(value) => onSidebarTabChange(value as 'selected' | 'classified')}
        className="flex flex-col flex-1"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selected">
            Seleccionados ({selectedIds.size})
          </TabsTrigger>
          <TabsTrigger value="classified">
            Clasificados ({classifiedGroups.length})
          </TabsTrigger>
        </TabsList>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="selected" className="flex flex-col h-full">
            <SelectedConceptsList
              selectedIds={selectedIds}
              concepts={concepts}
              standardName={standardName}
              onStandardNameChange={onStandardNameChange}
              isSaving={isSaving}
              onSaveClassification={onSaveClassification}
              onRemoveSelected={onToggleSelect}
            />
          </TabsContent>
          <TabsContent value="classified" className="flex flex-col h-full">
            <ClassifiedConceptsList
              groups={classifiedGroups}
              isLoading={isLoadingClassified}
              filterInput={classifiedFilterInput}
              onFilterChange={onClassifiedFilterChange}
              expandedGroup={expandedGroup}
              onExpandChange={onExpandedGroupChange}
              onDeleteItem={onDeleteClassifiedItem}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
