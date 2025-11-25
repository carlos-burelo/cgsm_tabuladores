'use client';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ClassifiedConceptItem } from './ClassifiedConceptItem';
import type { ClassifiedGroup } from '@/hooks/useClassifiedConcepts';

interface ClassifiedGroupItemProps {
  group: ClassifiedGroup;
  isExpanded: boolean;
  onExpandChange: (open: boolean) => void;
  onDeleteItem: (groupName: string, conceptId: number) => Promise<void>;
}

export function ClassifiedGroupItem({
  group,
  isExpanded,
  onExpandChange,
  onDeleteItem,
}: ClassifiedGroupItemProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onExpandChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="font-medium text-sm">
            {group.standardName}
            <span className="font-normal text-muted-foreground ml-2">({group.concepts.length})</span>
          </span>
          <ChevronDown className="h-4 w-4 transition-transform" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="space-y-2">
          {group.concepts.map((concept) => (
            <ClassifiedConceptItem
              key={concept.id}
              concept={concept}
              groupName={group.standardName}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
