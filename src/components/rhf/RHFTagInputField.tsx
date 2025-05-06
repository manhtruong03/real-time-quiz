// src/components/rhf/RHFTagInputField.tsx
import React from 'react';
import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { TagInput } from '@/src/components/ui/tag-input'; // Adjust path if needed
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/src/components/ui/form';
import { cn } from '@/src/lib/utils';

// Extend TagInput props if necessary, omit RHF-controlled ones
interface RHFTagInputFieldProps<TFieldValues extends FieldValues>
    extends Omit<React.ComponentProps<typeof TagInput>, 'value' | 'onChange' | 'name'> {
    name: Path<TFieldValues>;
    label?: string;
    description?: string;
    // Add other props like showAIButton, onGenerateAI later if needed
}

export function RHFTagInputField<TFieldValues extends FieldValues>({
    name,
    label,
    description,
    className, // Pass className to FormItem
    ...props // Pass remaining TagInput props
}: RHFTagInputFieldProps<TFieldValues>) {
    const { control } = useFormContext<TFieldValues>();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={className}>
                    {label && <FormLabel>{label}</FormLabel>}
                    <FormControl>
                        {/* Pass RHF's value and onChange to TagInput */}
                        <TagInput
                            value={field.value || []} // Ensure value is always an array
                            onChange={field.onChange}
                            onBlur={field.onBlur} // Pass onBlur for touched state
                            name={field.name}
                            inputRef={field.ref} // Pass ref if TagInput supports it internally (optional)
                            {...props} // Pass other TagInput props
                        />
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage /> {/* Displays validation errors (e.g., max tags) */}
                </FormItem>
            )}
        />
    );
}