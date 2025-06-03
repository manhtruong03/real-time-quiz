import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/src/lib/utils'; // [cite: 575]

interface QuestionDisplayProps {
  title: string;
  className?: string;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ title, className }) => {
  // Sanitize HTML content before rendering
  const sanitizedTitle = typeof window !== 'undefined' ? DOMPurify.sanitize(title) : title;

  return (
    <div className={cn("p-4 bg-background/80 rounded-lg shadow-md text-center", className)}>
      <h2
        className="text-xl md:text-2xl lg:text-3xl font-bold"
        dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
      />
    </div>
  );
};

export default QuestionDisplay;