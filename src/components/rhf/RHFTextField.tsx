// src/components/rhf/RHFTextField.tsx
import React from 'react';
import {
    useFormContext,
    Controller,
    FieldValues,
    Path,
    FieldError,
} from 'react-hook-form';
import { Input, InputProps } from '@/src/components/ui/input'; //
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/src/components/ui/form'; //
import { cn } from '@/src/lib/utils'; //

// Extend InputProps and add specific props for RHF
interface RHFTextFieldProps<TFieldValues extends FieldValues>
    extends Omit<InputProps, 'name'> {
    name: Path<TFieldValues>;
    label?: string;
    description?: string;
    // Add other props like showAIButton, onGenerateAI later if needed
}

export function RHFTextField<TFieldValues extends FieldValues>({
    name,
    label,
    description,
    className,
    ...props
}: RHFTextFieldProps<TFieldValues>) {
    const { control } = useFormContext<TFieldValues>();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => (
                <FormItem>
                    {label && <FormLabel>{label}</FormLabel>}
                    <FormControl>
                        <Input className={cn(className)} {...field} {...props} />
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage /> {/* Automatically displays validation errors */}
                </FormItem>
            )}
        />
    );
}