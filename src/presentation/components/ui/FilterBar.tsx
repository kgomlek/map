/**
 * 🟪 COUCHE PRÉSENTATION - Filter Bar
 * ZES App Style - Horizontal scrolling filter chips
 */

'use client';

import { useState } from 'react';
import { Zap, Plug, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'HPC' | 'DC' | 'AC' | 'BRAND' | null;

interface FilterChip {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

const filters: FilterChip[] = [
  {
    id: 'HPC',
    label: 'HPC',
    icon: (
      <div className="flex items-center gap-0.5">
        <Zap className="h-4 w-4" />
        <Zap className="h-4 w-4" />
      </div>
    ),
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
  },
  {
    id: 'DC',
    label: 'DC',
    icon: <Zap className="h-4 w-4" />,
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
  },
  {
    id: 'AC',
    label: 'AC',
    icon: <Plug className="h-4 w-4" />,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
  },
  {
    id: 'BRAND',
    label: 'Sadece Zes',
    icon: <Leaf className="h-4 w-4" />,
    bgColor: 'bg-white',
    textColor: 'text-black',
  },
];

export function FilterBar() {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const handleFilterClick = (filterId: FilterType) => {
    setActiveFilter(activeFilter === filterId ? null : filterId);
    // TODO: Implement filter logic in store
    console.log('Filter selected:', filterId);
  };

  return (
    <div className="px-4 pointer-events-auto">
      <div className="flex overflow-x-auto gap-2 p-2 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-md whitespace-nowrap transition-all',
              filter.bgColor,
              filter.textColor,
              activeFilter === filter.id && 'ring-2 ring-offset-2 ring-primary'
            )}
          >
            {filter.icon}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

