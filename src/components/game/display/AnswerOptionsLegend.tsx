import React from 'react';
import { Triangle, Diamond, Circle, Square } from 'lucide-react'; // [cite: 632]
import { AnswerOptionIndicatorProps } from '@/src/lib/types'; // Assuming types are in lib/types.ts [cite: 576]
import { cn } from '@/src/lib/utils'; // [cite: 575]

interface AnswerOptionsLegendProps {
  optionsCount: number;
  className?: string;
}

// Predefined color and shape mapping
const legendMapping: AnswerOptionIndicatorProps[] = [
  { index: 0, color: 'bg-red-500', Icon: Triangle },
  { index: 1, color: 'bg-blue-500', Icon: Diamond },
  { index: 2, color: 'bg-yellow-500', Icon: Circle },
  { index: 3, color: 'bg-green-500', Icon: Square },
];

const AnswerOptionIndicator: React.FC<AnswerOptionIndicatorProps> = ({ color, Icon }) => (
  <div className={cn(
    'flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg shadow-md',
    color
  )}>
    <Icon className="h-8 w-8 md:h-10 md:h-10 lg:h-12 lg:w-12 text-white fill-white" />
  </div>
);


const AnswerOptionsLegend: React.FC<AnswerOptionsLegendProps> = ({ optionsCount, className }) => {
  if (optionsCount <= 0) return null;

  const legendsToShow = legendMapping.slice(0, optionsCount);

  return (
    <div className={cn("grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 p-2 justify-center", className)}>
      {legendsToShow.map((legend) => (
        <AnswerOptionIndicator key={legend.index} {...legend} />
      ))}
    </div>
  );
};

export default AnswerOptionsLegend;