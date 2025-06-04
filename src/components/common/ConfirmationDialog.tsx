// src/components/common/ConfirmationDialog.tsx
"use client";

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    // AlertDialogTrigger, // Trigger will be handled by the parent component
} from "@/src/components/ui/alert-dialog"; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/components/ui/alert-dialog.tsx]
import { Button, ButtonProps } from "@/src/components/ui/button"; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/components/ui/button.tsx]
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils'; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/lib/utils.ts]

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    onConfirm: () => Promise<void> | void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonVariant?: ButtonProps['variant']; // Use ButtonProps['variant'] for type safety
    isConfirming?: boolean;
    icon?: React.ElementType; // Optional icon for the title
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmButtonText = "Xác nhận",
    cancelButtonText = "Hủy",
    confirmButtonVariant = "destructive", // Default to destructive for delete actions
    isConfirming = false,
    icon: Icon,
}) => {

    const handleConfirm = async () => {
        // No need to manage isConfirming state here if it's passed as a prop
        // The parent component will set isConfirming to true before calling onConfirm
        // and false after it resolves or rejects.
        await onConfirm();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className="bg-content-bg border-border-color text-text-primary"
            // Apply dark theme styles from screen-admin-01-account.html
            // --content-bg: #25252B;
            // --border-color: #404048;
            // --text-primary: #EAEAEA;
            >
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-xl text-text-primary">
                        {Icon && <Icon className={cn(
                            "mr-2 h-6 w-6",
                            confirmButtonVariant === "destructive" ? "text-danger-color" : "text-accent-color"
                        )} />}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-text-secondary pt-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel
                        asChild
                        disabled={isConfirming}
                        onClick={() => !isConfirming && onOpenChange(false)} // Ensure not to close if confirming
                        className={cn(
                            "bg-secondary-bg border-border-color text-text-secondary hover:bg-input-bg hover:text-text-primary",
                            // Style for cancel button to match dark theme
                        )}
                    >
                        <Button variant="outline" disabled={isConfirming}>
                            {cancelButtonText}
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction
                        asChild
                        disabled={isConfirming}
                        onClick={handleConfirm}
                        className={cn(
                            // Default destructive styling is usually red.
                            // If variant is 'default', it might use accent color.
                            confirmButtonVariant === "destructive" ? "bg-danger-color hover:bg-danger-hover text-white" :
                                confirmButtonVariant === "default" ? "bg-accent-color hover:bg-accent-hover text-white" :
                                    "", // Add other variant styles if needed
                            "text-white" // Ensure text is white for colored backgrounds
                        )}
                    >
                        <Button variant={confirmButtonVariant} disabled={isConfirming}>
                            {isConfirming ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                confirmButtonText
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmationDialog;