// src/components/media/MediaManager.tsx
"use client";

import React, { useState, memo, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import type { FieldValues, Path } from 'react-hook-form';
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { AspectRatio } from "@/src/components/ui/aspect-ratio";
import { ImagePlus, Sparkles, Trash2, Replace, AlertCircle, FileText, UploadCloud, Link as LinkIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogClose
} from "@/src/components/ui/dialog";
import { cn } from '@/src/lib/utils';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

interface MediaManagerProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>; // This refers to the 'image' or 'cover' URL field (string)
    fileFieldName: Path<TFieldValues>; // New prop for the File object field, e.g., 'imageFile' or 'coverImageFile'
    label?: string;
    aspectRatio?: number;
    placeholderText?: string;
    className?: string;
}

const MediaPlaceholder: React.FC<{
    text: string;
    isError?: boolean;
    onTriggerDialog: () => void;
    onAiClick?: () => void;
}> = ({ text, isError = false, onTriggerDialog, onAiClick }) => (
    <div className={cn(
        "border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 p-4 md:p-6 h-full transition-colors",
        isError
            ? "border-destructive text-destructive"
            : "border-muted-foreground/50 text-muted-foreground hover:border-primary/50"
    )}>
        {isError ? <AlertCircle className="h-10 w-10 mb-2" /> : <ImagePlus className="h-10 w-10 md:h-12 md:w-12 mb-1" strokeWidth={1} />}
        <span className={cn(
            "text-sm font-medium text-center max-w-xs",
            isError ? "text-destructive" : "text-muted-foreground"
        )}>
            {text}
        </span>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mt-2">
            <Button variant={isError ? "destructive" : "outline"} size="sm" className="w-full" type="button" onClick={onTriggerDialog}>
                {isError ? <Replace className="mr-2 h-4 w-4" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                {isError ? 'Try Again' : 'Add Media'}
            </Button>
            <Button variant="outline" size="sm" className="w-full" disabled onClick={onAiClick}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate AI
            </Button>
        </div>
    </div>
);

const MediaDisplayControls: React.FC<{ onDelete?: () => void; onTriggerDialog: () => void; }> = ({ onDelete, onTriggerDialog }) => (
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
        <Button variant="secondary" size="icon" title="Replace Image" type="button" onClick={onTriggerDialog}>
            <Replace className="h-4 w-4" />
        </Button>
        {onDelete && (
            <Button variant="destructive" size="icon" title="Remove Image" type="button" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
    </div>
);

const MediaManagerComponent = <TFieldValues extends FieldValues>({
    name: imageUrlFieldName,
    fileFieldName,
    label,
    aspectRatio = 16 / 9,
    placeholderText = 'Add media',
    className,
}: MediaManagerProps<TFieldValues>) => {
    const { control, setValue, watch } = useFormContext<TFieldValues>();

    const watchedImageUrlFieldValue = watch(imageUrlFieldName);
    const watchedImageFileFieldValue: any = watch(fileFieldName);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [tempUrlInput, setTempUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ref to store the blob URL that this component created and is responsible for.
    // This helps in explicitly revoking only the URLs created by this instance.
    const managedBlobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const file = watchedImageFileFieldValue as File | null;

        // 1. If a new file is selected
        if (file instanceof File) {
            // Revoke any previously managed blob URL before creating a new one
            if (managedBlobUrlRef.current) {
                URL.revokeObjectURL(managedBlobUrlRef.current);
                console.log(`[MediaManager Effect] Revoked old managed blob URL: ${managedBlobUrlRef.current}`);
            }

            const newObjectUrl = URL.createObjectURL(file);
            managedBlobUrlRef.current = newObjectUrl; // Store new blob URL as managed

            console.log(`[MediaManager Effect] Created new object URL ${newObjectUrl} for ${file.name}`);
            setValue(imageUrlFieldName, newObjectUrl as any, { shouldValidate: true, shouldDirty: true });
            // Note: fileFieldName is already set by handleFileSelectAndSet, which triggers this effect.

            setIsLoading(true);
            setHasError(false);
        }
        // 2. If the file is cleared (watchedImageFileFieldValue becomes null)
        else if (!file && managedBlobUrlRef.current) {
            // This case handles when the file is programmatically cleared (e.g., by handleDelete or handleUrlConfirm)
            console.log(`[MediaManager Effect] File cleared. Revoking managed blob URL: ${managedBlobUrlRef.current}`);
            URL.revokeObjectURL(managedBlobUrlRef.current);
            managedBlobUrlRef.current = null;

            // If the RHF URL field was showing our managed blob, clear it too.
            if (watchedImageUrlFieldValue === managedBlobUrlRef.current) { // This check might be problematic due to timing.
                // A safer check would be if watchedImageUrlFieldValue is a blob: URL
                // and we know we just cleared the file.
                if (typeof watchedImageUrlFieldValue === 'string' && watchedImageUrlFieldValue.startsWith('blob:')) {
                    setValue(imageUrlFieldName, null as any, { shouldValidate: true, shouldDirty: true });
                    console.log(`[MediaManager Effect] Cleared RHF URL field because it was a managed blob.`);
                }
            }
        }

        // Cleanup for component unmount: revoke the currently managed blob URL if it exists.
        return () => {
            if (managedBlobUrlRef.current) {
                console.log(`[MediaManager UNMOUNT] Revoking managed blob URL: ${managedBlobUrlRef.current}`);
                URL.revokeObjectURL(managedBlobUrlRef.current);
                managedBlobUrlRef.current = null;
            }
        };
    }, [watchedImageFileFieldValue, setValue, imageUrlFieldName]);

    const handleFileSelectAndSet = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.'); // Consider using toast for better UX
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // Example 5MB limit
                alert('File is too large. Maximum 5MB allowed.'); // Consider using toast
                return;
            }
            console.log(`[MediaManager] User selected file ${file.name}. Setting RHF field '${String(fileFieldName)}'.`);
            setValue(fileFieldName, file as any, { shouldDirty: true, shouldValidate: true });
            // The useEffect watching `fileFieldName` will handle object URL creation and setting `imageUrlFieldName`.
            setIsDialogOpen(false);
            setTempUrlInput(''); // Clear temporary URL input
        }
    };

    const handleUrlConfirm = () => {
        if (tempUrlInput.trim() && (tempUrlInput.startsWith('http://') || tempUrlInput.startsWith('https://'))) {
            console.log(`[MediaManager] User confirmed URL ${tempUrlInput}. Setting RHF field '${String(imageUrlFieldName)}' and clearing '${String(fileFieldName)}'.`);

            // If a file was previously selected and managed by this component, its blob URL needs to be revoked.
            // Setting fileFieldName to null will trigger the useEffect to do this.
            if (managedBlobUrlRef.current) {
                console.log(`[MediaManager] Clearing existing file selection due to URL input.`);
            }
            setValue(fileFieldName, null as any, { shouldDirty: true, shouldValidate: true }); // Clear file

            // Now set the new HTTP/S URL. The useEffect will handle cleanup of the old blob if `fileFieldName` changed.
            setValue(imageUrlFieldName, tempUrlInput.trim() as any, { shouldDirty: true, shouldValidate: true });

            setIsLoading(true);
            setHasError(false);
            setIsDialogOpen(false);
        } else {
            alert("Please enter a valid HTTP/HTTPS URL."); // Consider using toast
        }
    };

    const handleDelete = () => {
        console.log(`[MediaManager] Deleting image. Clearing RHF fields '${String(imageUrlFieldName)}' and '${String(fileFieldName)}'.`);
        // Setting fileFieldName to null will trigger the useEffect to revoke the managed blob URL.
        setValue(fileFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        setValue(imageUrlFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        // No need to directly call URL.revokeObjectURL here; useEffect handles it via managedBlobUrlRef

        setTempUrlInput('');
        setIsLoading(false);
        setHasError(false);
    };

    useEffect(() => {
        if (isDialogOpen) {
            if (typeof watchedImageUrlFieldValue === 'string' && !watchedImageUrlFieldValue.startsWith('blob:')) {
                setTempUrlInput(watchedImageUrlFieldValue);
            } else {
                setTempUrlInput(''); // Clear if it's a blob URL or null
            }
        }
    }, [isDialogOpen, watchedImageUrlFieldValue]);

    const displayUrl = typeof watchedImageUrlFieldValue === 'string' ? watchedImageUrlFieldValue : null;
    const showPlaceholder = !displayUrl || hasError;
    const currentPlaceholderText = hasError ? "Error loading image." : placeholderText;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card className={cn('overflow-hidden h-full', className)}>
                <AspectRatio ratio={aspectRatio} className="bg-muted h-full">
                    {showPlaceholder ? (
                        <MediaPlaceholder
                            text={currentPlaceholderText}
                            isError={hasError}
                            onTriggerDialog={() => setIsDialogOpen(true)}
                            onAiClick={() => console.log("AI Generate (MediaManager) - Not implemented")}
                        />
                    ) : (
                        <div className="relative w-full h-full group">
                            {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
                            {displayUrl && (
                                <Image
                                    key={displayUrl} // Re-render if URL changes, helps with Next/Image caching
                                    src={displayUrl}
                                    alt={label || 'Media preview'}
                                    fill
                                    className={cn(
                                        'object-contain transition-opacity duration-300',
                                        isLoading ? 'opacity-0' : 'opacity-100'
                                    )}
                                    priority={false}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onLoad={() => {
                                        console.log("[MediaManager] Image loaded:", displayUrl);
                                        setIsLoading(false);
                                        setHasError(false);
                                    }}
                                    onError={() => {
                                        console.error(`[MediaManager] Image failed to load: ${displayUrl}`);
                                        setIsLoading(false);
                                        setHasError(true);
                                        // No need to clear RHF fields here; let user decide or backend handle invalid URLs.
                                        // If it was our blob, useEffect would ideally catch it if the file reference was bad.
                                    }}
                                />
                            )}
                            {!isLoading && !hasError && displayUrl && (
                                <MediaDisplayControls onDelete={handleDelete} onTriggerDialog={() => setIsDialogOpen(true)} />
                            )}
                        </div>
                    )}
                </AspectRatio>
            </Card>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{displayUrl && !hasError && !isLoading ? "Replace" : "Add"} Media</DialogTitle>
                    <DialogDescription>
                        Upload an image from your device or provide an image URL. Max 5MB.
                    </DialogDescription>
                </DialogHeader>
                <input
                    type="file"
                    accept="image/*" // Standard image/* accept
                    ref={fileInputRef}
                    onChange={handleFileSelectAndSet}
                    className="hidden"
                    id={`file-input-${String(imageUrlFieldName).replace(/\./g, '-')}`}
                />
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload"><UploadCloud className="mr-1 h-4 w-4" /> Upload File</TabsTrigger>
                        <TabsTrigger value="url"><LinkIcon className="mr-1 h-4 w-4" /> By URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-4 space-y-4">
                        <Label
                            htmlFor={`file-input-${String(imageUrlFieldName).replace(/\./g, '-')}`}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                                "bg-muted/50 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                            )}
                        >
                            <UploadCloud className="h-10 w-10 mb-2" />
                            <span className="text-sm font-medium">Click to browse or drag & drop</span>
                            <span className="text-xs mt-1">PNG, JPG, GIF, WEBP up to 5MB</span>
                        </Label>
                        {watchedImageFileFieldValue instanceof File && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                                <FileText className="h-4 w-4" />
                                <span>Selected: {watchedImageFileFieldValue.name} ({(watchedImageFileFieldValue.size / (1024 * 1024)).toFixed(2)} MB)</span>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="url" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${String(imageUrlFieldName).replace(/\./g, '-')}-url-input-dialog`}>Image URL</Label>
                            <Input
                                id={`${String(imageUrlFieldName).replace(/\./g, '-')}-url-input-dialog`}
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={tempUrlInput}
                                onChange={(e) => setTempUrlInput(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={handleUrlConfirm}
                                disabled={!tempUrlInput.trim() || !(tempUrlInput.startsWith('http://') || tempUrlInput.startsWith('https://'))}
                            >
                                Use this URL
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="mt-4 w-full sm:w-auto">
                        Cancel
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};

export const MediaManager = memo(MediaManagerComponent) as typeof MediaManagerComponent;