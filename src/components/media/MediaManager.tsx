// src/components/media/MediaManager.tsx
"use client";

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { useFormContext, useWatch } from 'react-hook-form';
import { FieldValues, Path } from 'react-hook-form';
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { AspectRatio } from "@/src/components/ui/aspect-ratio";
import { ImagePlus, Sparkles, Trash2, Replace, AlertCircle } from 'lucide-react'; // Added AlertCircle
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/src/components/ui/dialog";
import { MediaEditOptions } from './MediaEditOptions';
import { cn } from '@/src/lib/utils';
import { Skeleton } from '@/src/components/ui/skeleton';

interface MediaManagerProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    label?: string;
    aspectRatio?: number;
    placeholderText?: string;
    className?: string;
}

// MediaPlaceholder: Added props for error state
const MediaPlaceholder: React.FC<{
    text: string;
    isError?: boolean; // New prop
    onAiClick?: () => void;
}> = ({ text, isError = false, onAiClick }) => (
    <div className={cn(
        "border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 p-4 md:p-6 h-full transition-colors",
        isError
            ? "border-destructive text-destructive" // Style differently on error
            : "border-muted-foreground/50 text-muted-foreground hover:border-primary/50"
    )}>
        {isError ? <AlertCircle className="h-10 w-10 mb-2" /> : <ImagePlus className="h-10 w-10 md:h-12 md:w-12 mb-1" strokeWidth={1} />}
        <span className={cn(
            "text-sm font-medium text-center max-w-xs",
            isError ? "text-destructive" : "text-muted-foreground" // Adjust text color
        )}>
            {text}
        </span>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mt-2">
            {/* Trigger remains the same, user can retry */}
            <DialogTrigger asChild>
                <Button variant={isError ? "destructive" : "outline"} size="sm" className="w-full" type="button">
                    {isError ? <Replace className="mr-2 h-4 w-4" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    {isError ? 'Try Again' : 'Add Media'}
                </Button>
            </DialogTrigger>
            <Button variant="outline" size="sm" className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" /> Generate AI
            </Button>
        </div>
    </div>
);

// MediaDisplayControls remains the same
const MediaDisplayControls: React.FC<{ onDelete?: () => void; }> = ({ onDelete }) => (
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
        <DialogTrigger asChild>
            <Button variant="secondary" size="icon" title="Replace Image" type="button">
                <Replace className="h-4 w-4" />
            </Button>
        </DialogTrigger>
        <Button variant="destructive" size="icon" title="Remove Image" type="button" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
);


// --- Main Component Logic ---
const MediaManagerComponent = <TFieldValues extends FieldValues>({
    name,
    label,
    aspectRatio = 16 / 9,
    placeholderText = 'Add a cover image',
    className,
}: MediaManagerProps<TFieldValues>) => {
    const { control, setValue } = useFormContext<TFieldValues>();
    const imageUrl = useWatch({ control, name });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false); // Track loading error

    // Handlers
    const handleGenerateAI = () => console.log('Generate AI Clicked (Not Implemented)');
    const handleDelete = () => {
        console.log('Delete Clicked - Setting RHF value to null');
        setValue(name, null as any, { shouldValidate: true, shouldDirty: true });
        setHasError(false); // Reset error state
        setIsLoading(false); // Reset loading state
    };

    const handleUrlSubmit = (url: string) => {
        console.log('URL Submitted:', url);
        // Set loading and reset error *before* setting value to trigger useEffect correctly
        setIsLoading(true);
        setHasError(false);
        setValue(name, url as any, { shouldValidate: true, shouldDirty: true });
        setIsDialogOpen(false);
    };

    // Effect to reset loading/error state when URL changes or is cleared
    React.useEffect(() => {
        if (imageUrl && typeof imageUrl === 'string') {
            setIsLoading(true); // Start loading only if there's a new URL
            setHasError(false);
        } else {
            // If URL is null or not a string, reset states
            setIsLoading(false);
            setHasError(false);
        }
    }, [imageUrl]); // Re-run when imageUrl changes

    // Determine if placeholder should be shown (no URL or error occurred)
    const showPlaceholder = !imageUrl || hasError;

    // Determine placeholder text based on error state
    const currentPlaceholderText = hasError
        ? "Failed to load image. Please check the URL or try uploading."
        : placeholderText;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card className={cn('overflow-hidden h-full', className)}>
                <AspectRatio ratio={aspectRatio} className="bg-muted h-full">
                    {showPlaceholder ? (
                        <MediaPlaceholder
                            text={currentPlaceholderText}
                            isError={hasError} // Pass error state
                            onAiClick={handleGenerateAI}
                        />
                    ) : (
                        <div className="relative w-full h-full group">
                            {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
                            {/* Ensure imageUrl is valid string before rendering Image */}
                            {imageUrl && typeof imageUrl === 'string' && (
                                <Image
                                    key={imageUrl} // Re-render image if URL changes
                                    src={imageUrl}
                                    alt={label || 'Uploaded media'}
                                    fill
                                    className={cn(
                                        'object-cover transition-opacity duration-300',
                                        isLoading ? 'opacity-0' : 'opacity-100'
                                    )}
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onLoad={() => {
                                        console.log("Image loaded successfully:", imageUrl);
                                        setIsLoading(false);
                                        setHasError(false); // Explicitly set error to false on load
                                    }}
                                    onError={() => {
                                        console.error(`Failed to load image: ${imageUrl}`);
                                        setIsLoading(false);
                                        setHasError(true); // Set error state to true
                                    }}
                                />
                            )}
                            {/* Only show controls if NOT loading and NOT in error state */}
                            {!isLoading && !hasError && imageUrl && (
                                <MediaDisplayControls onDelete={handleDelete} />
                            )}
                        </div>
                    )}
                </AspectRatio>
            </Card>

            {/* Dialog Content is rendered here */}
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Add or Replace Media</DialogTitle>
                    <DialogDescription>
                        Provide an image URL or upload a file (upload not implemented yet).
                    </DialogDescription>
                </DialogHeader>
                <MediaEditOptions
                    onUrlSubmit={handleUrlSubmit}
                />
            </DialogContent>
        </Dialog>
    );
};

export const MediaManager = memo(MediaManagerComponent) as typeof MediaManagerComponent;