// src/components/rhf/RHFTextAreaField.tsx
import React from 'react';
import {
    useFormContext,
    Controller,
    FieldValues,
    Path,
    FieldError,
} from 'react-hook-form';
import { Textarea } from '@/src/components/ui/textarea'; // Import the component
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/src/components/ui/form';
import { cn } from '@/src/lib/utils';

// Extend React's built-in textarea props directly
interface RHFTextAreaFieldProps<TFieldValues extends FieldValues>
    extends Omit<React.ComponentProps<'textarea'>, 'name'> { // <-- Use React.ComponentProps<'textarea'>
    name: Path<TFieldValues>;
    label?: string;
    description?: string;
    // Add other props like showAIButton, onGenerateAI later if needed
}

export function RHFTextAreaField<TFieldValues extends FieldValues>({
    name,
    label,
    description,
    className,
    ...props
}: RHFTextAreaFieldProps<TFieldValues>) {
    const { control } = useFormContext<TFieldValues>();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => (
                <FormItem>
                    {label && <FormLabel>{label}</FormLabel>}
                    <FormControl>
                        <Textarea
                            className={cn('resize-none', className)} // Basic styling
                            {...field}
                            {...props} // Pass the rest of the textarea props
                        />
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage /> {/* Automatically displays validation errors */}
                </FormItem>
            )}
        />
    );
}

// No need to export RHFTextAreaFieldProps if not used externally