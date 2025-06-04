// src/lib/api/admin/images.ts
import { fetchWithAuth, API_ENDPOINTS } from "@/src/lib/api/client"; //
import type {
  Page,
  PageableParams,
  ImageStorageAdminViewDTO,
  MessageResponse,
} from "@/src/lib/types/api"; //

/**
 * Fetches a paginated list of all image records from the backend.
 * Corresponds to GET /api/admin/images endpoint.
 *
 * @param params - Optional pagination and sorting parameters.
 * - page: 0-indexed page number (default: 0)
 * - size: Number of items per page (default: 10)
 * - sort: Array of sort strings, e.g., ["createdAt,desc"] (default: ["createdAt,desc"])
 * @returns A Promise resolving to a Page of ImageStorageAdminViewDTO.
 */
export const getAllImagesAdmin = async (
  params?: PageableParams
): Promise<Page<ImageStorageAdminViewDTO>> => {
  const queryParams = new URLSearchParams();

  // Apply default pagination and sort if not provided, matching API docs example
  queryParams.append("page", (params?.page ?? 0).toString());
  queryParams.append("size", (params?.size ?? 10).toString());

  const sortParams =
    params?.sort && params.sort.length > 0 ? params.sort : ["createdAt,desc"];
  sortParams.forEach((sortParam) => queryParams.append("sort", sortParam));

  const url = `${API_ENDPOINTS.ADMIN.IMAGES.GET_ALL}?${queryParams.toString()}`;

  // Assuming fetchWithAuth handles potential errors and returns parsed JSON or throws an error
  // The type assertion might be needed if fetchWithAuth is generically typed.
  return fetchWithAuth(url, { method: "GET" }) as Promise<
    Page<ImageStorageAdminViewDTO>
  >;
};

/**
 * Deletes an image record from the database and its corresponding physical file from storage.
 * Corresponds to DELETE /api/admin/images/{imageId} endpoint.
 * Requires ADMIN role.
 *
 * @param imageId - The UUID of the image record to delete.
 * @returns A Promise resolving to a MessageResponse indicating success or failure.
 */
export const deleteImageAdmin = async (
  imageId: string
): Promise<MessageResponse> => {
  const url = `${API_ENDPOINTS.ADMIN.IMAGES.GET_ALL}/${imageId}`;
  // Assuming fetchWithAuth correctly handles responses and errors for non-GET requests
  // and can parse MessageResponse for successful DELETE operations that return a body.
  return fetchWithAuth(url, { method: "DELETE" }) as Promise<MessageResponse>;
};

/**
 * Uploads a new image by an administrator.
 * Corresponds to POST /api/admin/images/upload endpoint.
 * Requires ADMIN role.
 *
 * @param imageFile - The image file to upload.
 * @param creatorId - (Optional) UUID of the user to be credited with the upload.
 * If omitted, the uploading admin is credited.
 * @returns A Promise resolving to an ImageStorageAdminViewDTO of the uploaded image.
 */
export const uploadImageAdmin = async (
  imageFile: File,
  creatorId?: string
): Promise<ImageStorageAdminViewDTO> => {
  const formData = new FormData();
  formData.append("imageFile", imageFile);

  let url = API_ENDPOINTS.ADMIN.IMAGES.UPLOAD;
  if (creatorId) {
    const queryParams = new URLSearchParams();
    queryParams.append("creatorId", creatorId);
    url += `?${queryParams.toString()}`;
  }

  // When using FormData with fetch, the Content-Type header (multipart/form-data)
  // is set automatically by the browser, including the boundary.
  // fetchWithAuth should not override this if the body is FormData.
  return fetchWithAuth(url, {
    method: "POST",
    body: formData,
    // No 'Content-Type' header here, let the browser handle it for FormData
  }) as Promise<ImageStorageAdminViewDTO>;
};
