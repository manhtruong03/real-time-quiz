// src/app/admin/images/components/AdminImagesPageContent.tsx
"use client";

import React, { useState } from 'react'; // Import useState
import { Button } from '@/src/components/ui/button'; //
import { Upload, AlertTriangle } from 'lucide-react';
import ImagesTable from './ImagesTable';
import AdminImagesPagination from './AdminImagesPagination';
import { useAdminImagesData } from '../hooks/useAdminImagesData';
import ImagesTableSkeleton from './ImagesTableSkeleton';
import ImagesErrorState from './ImagesErrorState';
import ImagesEmptyState from './ImagesEmptyState';
import ConfirmationDialog from '@/src/components/common/ConfirmationDialog'; //
import { useToast } from '@/src/hooks/use-toast'; //
import { deleteImageAdmin } from '@/src/lib/api/admin/images';
import type { ImageStorageAdminViewDTO } from '@/src/lib/types/api'; //

// Import for Upload Dialog
import ImageUploadFormDialog from './ImageUploadFormDialog'; // [from Step 4.3]

const AdminImagesPageContent: React.FC = () => {
    const {
        images,
        isLoading,
        error,
        currentPage,
        totalPages,
        totalElements,
        goToPage,
        refreshImages, // Used for refreshing list after upload/delete
    } = useAdminImagesData();

    const { toast } = useToast();

    // State for Delete Confirmation Dialog
    const [imageToDelete, setImageToDelete] = useState<ImageStorageAdminViewDTO | null>(null);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for Upload Dialog
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

    // Opens the Upload Dialog
    const handleOpenUploadDialog = () => {
        setIsUploadDialogOpen(true);
    };

    // Callback for successful upload
    const handleUploadSuccess = (uploadedImage: ImageStorageAdminViewDTO) => {
        // Refresh the current page to show the new image.
        // Depending on sorting, the new image might be on the first page or last.
        // For simplicity, refreshing the current page is a good start.
        // If new images are always on page 0 (e.g. sorted by newest first and page size is adequate)
        // you could also do goToPage(0) then refreshImages({page: 0}) or just refreshImages()
        // and let the hook handle its current page.
        refreshImages(); // This will refetch based on the hook's current page, sort, size
        // toast is handled within ImageUploadFormDialog for success/failure of upload itself
    };


    // --- Deletion Logic (from Phase 3) ---
    const handleDeleteImageRequest = (image: ImageStorageAdminViewDTO) => {
        setImageToDelete(image);
        setIsConfirmDeleteDialogOpen(true);
    };

    const handleDialogClose = (isOpen: boolean) => {
        setIsConfirmDeleteDialogOpen(isOpen);
        if (!isOpen) {
            setImageToDelete(null);
        }
    };

    const executeDeleteImage = async () => {
        if (!imageToDelete) return;
        setIsDeleting(true);
        try {
            const response = await deleteImageAdmin(imageToDelete.imageId);
            toast({
                title: "Thành công!",
                description: response.message || `Hình ảnh "${imageToDelete.originalFileName}" đã được xóa.`,
            });
            refreshImages();
            handleDialogClose(false);
        } catch (err: any) {
            toast({
                title: "Lỗi xóa hình ảnh",
                description: err.data?.message || err.message || "Không thể xóa hình ảnh.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };
    // --- End of Deletion Logic ---


    const renderContent = () => {
        if (isLoading && images.length === 0) { // Show skeleton only on initial load or full refetch
            return <ImagesTableSkeleton />;
        }
        if (error) {
            return <ImagesErrorState error={error} onRetry={refreshImages} />;
        }
        if (!isLoading && images.length === 0 && totalElements === 0) { // Check totalElements for true empty state from API
            return <ImagesEmptyState />;
        }
        return (
            <>
                <ImagesTable
                    images={images}
                    onDeleteImageRequest={handleDeleteImageRequest}
                />
                {totalPages > 0 && (
                    <AdminImagesPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                        className="mt-6 py-4"
                    />
                )}
            </>
        );
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                    Quản lý Hình ảnh
                </h1>
                <Button
                    onClick={handleOpenUploadDialog} // Updated to open upload dialog
                    variant="default"
                    className="bg-accent-color hover:bg-accent-hover text-white"
                >
                    <Upload className="mr-2 h-5 w-5" />
                    Thêm ảnh
                </Button>
            </div>

            <div className="bg-secondary-bg p-1 md:p-3 rounded-lg shadow-md min-h-[300px]">
                {renderContent()}
            </div>

            {/* Confirmation Dialog for Deletion (from Phase 3) */}
            {imageToDelete && (
                <ConfirmationDialog
                    open={isConfirmDeleteDialogOpen}
                    onOpenChange={handleDialogClose}
                    title="Xác nhận xóa hình ảnh"
                    description={
                        <>
                            Bạn có chắc chắn muốn xóa hình ảnh
                            <strong className="px-1">{imageToDelete.originalFileName}</strong>?
                            <br />
                            Hành động này không thể hoàn tác.
                        </>
                    }
                    onConfirm={executeDeleteImage}
                    confirmButtonText="Xóa"
                    confirmButtonVariant="destructive"
                    isConfirming={isDeleting}
                    icon={AlertTriangle}
                />
            )}

            {/* Image Upload Dialog */}
            <ImageUploadFormDialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                onUploadSuccess={handleUploadSuccess}
            />
        </>
    );
};

export default AdminImagesPageContent;