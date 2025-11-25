'use client';

import { Input } from "./ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceType {
  id: number;
  name: string;
  description?: string | null;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  serviceTypes: ServiceType[];
  selectedServiceType: number | null;
  onServiceTypeChange: (id: number) => void;
  isLoadingTypes: boolean;
}

export function SearchBar({
  value,
  onChange,
  serviceTypes,
  selectedServiceType,
  onServiceTypeChange,
  isLoadingTypes,
}: SearchBarProps) {
  return (
    <div className="bg-background sticky top-0 z-10">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4">
        <div className="flex gap-3 items-end">
          <Input
            type="text"
            className="h-10 flex-1"
            placeholder="Busca por nombre estándar o concepto..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
          <Select
            value={String(selectedServiceType || '')}
            onValueChange={(value) => onServiceTypeChange(Number(value))}
            disabled={isLoadingTypes}
          >
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="-- Tipo de servicio --" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
