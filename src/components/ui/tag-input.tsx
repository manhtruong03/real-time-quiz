// src/components/ui/tag-input.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
    className?: string;
    inputClassName?: string;
    badgeClassName?: string;
    inputRef?: React.Ref<HTMLInputElement>; // <-- ADD inputRef prop type
}

export const TagInput: React.FC<TagInputProps> = ({
    value = [],
    onChange,
    placeholder = 'Add tags...',
    maxTags,
    className,
    inputClassName,
    badgeClassName,
    inputRef, // <-- ACCEPT inputRef prop
    ...inputProps
}) => {
    const [inputValue, setInputValue] = useState('');
    // Use the passed ref OR create a local one if none is passed
    const internalInputRef = useRef<HTMLInputElement>(null);
    const resolvedRef = inputRef || internalInputRef; // Use passed ref primarily

    const handleAddTag = useCallback(
        // ... (keep existing handleAddTag logic) ...
        (tagToAdd: string) => {
            const trimmedTag = tagToAdd.trim();
            if (trimmedTag && !value.includes(trimmedTag)) {
                if (maxTags === undefined || value.length < maxTags) {
                    onChange([...value, trimmedTag]);
                    setInputValue(''); // Clear input after adding
                } else {
                    console.warn(`Max tags limit (${maxTags}) reached.`);
                }
            } else if (!trimmedTag) {
                setInputValue('');
            }
        },
        [value, onChange, maxTags]
    );

    const handleRemoveTag = useCallback(
        // ... (keep existing handleRemoveTag logic) ...
        (tagToRemove: string) => {
            onChange(value.filter((tag) => tag !== tagToRemove));
        },
        [value, onChange]
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // ... (keep existing handleKeyDown logic) ...
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            handleAddTag(inputValue);
        } else if (event.key === 'Backspace' && !inputValue && value.length > 0) {
            handleRemoveTag(value[value.length - 1]);
        }
    };

    // Focus input when clicking the wrapper
    const focusInput = () => {
        if (typeof resolvedRef === 'object' && resolvedRef && resolvedRef.current) {
            resolvedRef.current.focus();
        }
    };


    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2 p-2 border border-input rounded-md bg-background min-h-[40px]',
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                className
            )}
            onClick={focusInput} // <-- Use the new focus function
        >
            {value.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className={cn('flex items-center gap-1', badgeClassName)}
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(tag);
                        }}
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label={`Remove ${tag}`}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                </Badge>
            ))}
            <Input
                ref={resolvedRef} // <-- PASS THE REF HERE
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => handleAddTag(inputValue)}
                className={cn(
                    'flex-grow h-auto p-0 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm bg-transparent min-w-[80px]',
                    inputClassName
                )}
                disabled={maxTags !== undefined && value.length >= maxTags}
                {...inputProps}
            />
        </div>
    );
};