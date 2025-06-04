// src/app/admin/images/components/ImagesTable.tsx
"use client";

import React, { useState } from 'react';
// import Image from 'next/image';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/src/components/ui/table'; //
import { Button } from '@/src/components/ui/button'; //
import { Trash2, ImageOff, Eye } from 'lucide-react';
import type { ImageStorageAdminViewDTO } from '@/src/lib/types/api'; //
import { cn } from '@/src/lib/utils'; //

// Helper function to format file size (remains local for Phase 2)
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format timestamp (remains local for Phase 2)
const formatImageTimestamp = (isoString: string): string => {
    try {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        return "Invalid date";
    }
};

// Helper to extract simple file type (remains local for Phase 2)
const getSimpleFileType = (contentType: string): string => {
    if (!contentType || !contentType.includes('/')) return 'N/A';
    return contentType.split('/')[1]?.toUpperCase() || 'N/A';
};

// ImageThumbnail sub-component (remains local)
interface ImageThumbnailProps {
    src: string;
    alt: string;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ src, alt }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src || src === 'invalid-url-for-testing') {
        return (
            <div
                className="w-[60px] h-[40px] bg-input-bg border border-border-color rounded flex items-center justify-center text-text-placeholder"
                title="Không thể tải ảnh"
            >
                <ImageOff size={20} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-[60px] h-[40px] object-cover rounded border border-border-color bg-input-bg"
            onError={() => setHasError(true)}
        />
    );
};

// Define props for ImagesTable
interface ImagesTableProps {
    images: ImageStorageAdminViewDTO[];
    onDeleteImageRequest: (image: ImageStorageAdminViewDTO) => void; // New prop for delete request
    // onEditImage will be added in Phase 5 (optional)
}

const ImagesTable: React.FC<ImagesTableProps> = ({ images, onDeleteImageRequest }) => {
    const thClasses = "px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary bg-table-header-bg whitespace-nowrap";
    const tdClasses = "px-3 py-3 whitespace-nowrap text-sm text-text-primary align-middle";
    const rowClasses = "border-b border-border-color hover:bg-table-row-hover-bg";

    // The local handleDeleteImage function is no longer needed if we directly call the prop.
    // However, if any pre-processing were needed here before calling the prop, it could be kept.
    // For direct pass-through:
    // const handleDeleteImage = (image: ImageStorageAdminViewDTO) => {
    //   onDeleteImageRequest(image);
    // };

    const handlePreviewImage = (image: ImageStorageAdminViewDTO) => {
        console.log("Preview image:", image.publicUrl);
        if (image.publicUrl && image.publicUrl !== 'invalid-url-for-testing') {
            window.open(image.publicUrl, '_blank');
        } else {
            alert("Không có ảnh hợp lệ để xem trước.");
        }
    };

    return (
        <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-border-color">
                <TableHeader>
                    <TableRow className="border-b-0">
                        <TableHead className={cn(thClasses, "rounded-tl-md w-[80px]")}>Xem trước</TableHead>
                        <TableHead className={thClasses}>Tên ảnh</TableHead>
                        <TableHead className={thClasses}>Người tạo</TableHead>
                        <TableHead className={thClasses}>Ngày tải lên</TableHead>
                        <TableHead className={thClasses}>Kích thước</TableHead>
                        <TableHead className={thClasses}>Loại file</TableHead>
                        <TableHead className={cn(thClasses, "text-center rounded-tr-md")}>Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-secondary-bg divide-y divide-border-color">
                    {images.map((image) => (
                        <TableRow key={image.imageId} className={rowClasses}>
                            <TableCell className={cn(tdClasses, "w-[80px]")}>
                                <ImageThumbnail src={image.publicUrl} alt={image.originalFileName} />
                            </TableCell>
                            <TableCell className={tdClasses}>
                                <span title={image.originalFileName} className="truncate block max-w-xs">
                                    {image.originalFileName}
                                </span>
                            </TableCell>
                            <TableCell className={cn(tdClasses, "text-text-secondary")}>{image.creatorUsername || 'N/A'}</TableCell>
                            <TableCell className={cn(tdClasses, "text-text-secondary")}>{formatImageTimestamp(image.createdAt)}</TableCell>
                            <TableCell className={cn(tdClasses, "text-text-secondary")}>{formatFileSize(image.fileSize)}</TableCell>
                            <TableCell className={cn(tdClasses, "text-text-secondary")}>{getSimpleFileType(image.contentType)}</TableCell>
                            <TableCell className={cn(tdClasses, "text-center space-x-1")}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-blue-500 hover:text-blue-400 h-8 w-8"
                                    onClick={() => handlePreviewImage(image)}
                                    title="Xem ảnh đầy đủ"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-danger-color hover:text-danger-hover h-8 w-8"
                                    onClick={() => onDeleteImageRequest(image)} // Call the new prop
                                    title="Xóa ảnh"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ImagesTable;