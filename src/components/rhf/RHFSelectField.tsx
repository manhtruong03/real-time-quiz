// src/components/rhf/RHFSelectField.tsx
import React from 'react';
import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import * as SelectPrimitive from '@radix-ui/react-select'; // Import the primitive
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    // SelectProps, <-- REMOVE THIS
} from '@/src/components/ui/select';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/src/components/ui/form';
import { cn } from '@/src/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

// Extend props from the Radix primitive Root component
interface RHFSelectFieldProps<TFieldValues extends FieldValues>
    extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'name' | 'defaultValue' | 'onValueChange' | 'value'> { // <-- EXTEND PRIMITIVE PROPS
    name: Path<TFieldValues>;
    label?: string;
    description?: string;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
}

// ... rest of the component remains the same ...

export function RHFSelectField<TFieldValues extends FieldValues>({
    name,
    label,
    description,
    options,
    placeholder,
    className,
    triggerClassName,
    contentClassName,
    ...props // Pass remaining SelectPrimitive.Root props
}: RHFSelectFieldProps<TFieldValues>) {
    const { control } = useFormContext<TFieldValues>();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className={className}>
                    {label && <FormLabel>{label}</FormLabel>}
                    {/* Pass RHF's value and onValueChange to the Select component */}
                    <Select
                        onValueChange={field.onChange}
                        value={field.value} // Control the value via RHF
                        {...props} // Pass other SelectPrimitive.Root props
                    >
                        <FormControl>
                            <SelectTrigger className={triggerClassName}>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className={contentClassName}>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}