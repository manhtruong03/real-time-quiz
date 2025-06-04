'use client';

import React, { useState } from 'react';
import { Input } from '@/src/components/ui/input'; // [cite: 424]
import { Button } from '@/src/components/ui/button'; // [cite: 535]
import { Send } from 'lucide-react'; // [cite: 632]
import { cn } from '@/src/lib/utils'; // [cite: 575]

interface OpenEndedInputProps {
  onSubmit: (text: string) => void;
  isDisabled: boolean;
  maxLength?: number;
  className?: string;
}

const OpenEndedInput: React.FC<OpenEndedInputProps> = ({
  onSubmit,
  isDisabled,
  maxLength = 100, // Default max length
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isDisabled) {
      onSubmit(inputValue.trim());
      // Optionally clear input after submit: setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-3 items-stretch", className)}>
      <Input
        type="text"
        placeholder="Nhập câu trả lời của bạn..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isDisabled}
        maxLength={maxLength}
        className="text-lg p-4 h-auto" // Larger text for input
        aria-label="Đáp án của bạn"
      />
      <Button
        type="submit"
        disabled={isDisabled || !inputValue.trim()}
        size="lg" // [cite: 537]
        className="gap-2"
      >
        Gửi
        <Send className="h-4 w-4" />
      </Button>
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right"> {/* [cite: 606, 613] */}
          {inputValue.length} / {maxLength}
        </p>
      )}
    </form>
  );
};

export default OpenEndedInput;