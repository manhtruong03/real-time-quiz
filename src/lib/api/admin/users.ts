// src/lib/api/admin/users.ts
import { fetchWithAuth, API_ENDPOINTS, FetchOptions } from "../client";
import type {
  Page,
  PageableParams,
  UserAccountAdminViewDTO,
  UserAccountCreationRequestDTO,
  UserAccountUpdateRequestDTO,
  MessageResponse,
} from "../../types/api";

/**
 * Retrieves a paginated list of all user accounts. Requires ADMIN role.
 * Corresponds to: GET /api/admin/users
 * @param pageable - Pagination and sorting parameters.
 * @param options - Optional fetch options.
 * @returns A promise that resolves to a Page of UserAccountAdminViewDTO.
 */
export async function getAllUsersAdmin(
  pageable: PageableParams,
  options: FetchOptions = {}
): Promise<Page<UserAccountAdminViewDTO>> {
  const queryParams = new URLSearchParams();
  if (pageable.page !== undefined)
    queryParams.append("page", pageable.page.toString());
  if (pageable.size !== undefined)
    queryParams.append("size", pageable.size.toString());
  if (pageable.sort) {
    pageable.sort.forEach((sortParam) => queryParams.append("sort", sortParam));
  }

  const endpoint = `${
    API_ENDPOINTS.ADMIN.USERS.GET_ALL
  }?${queryParams.toString()}`;

  return fetchWithAuth<Page<UserAccountAdminViewDTO>>(endpoint, {
    method: "GET",
    ...options,
    // Ensuring includeAuthHeader is true by default from fetchWithAuth,
    // but can be overridden if needed via options.
  });
}

/**
 * Creates a new user account by an administrator. Requires ADMIN role.
 * Corresponds to: POST /api/admin/users
 * @param userData - Details of the user account to create.
 * @param options - Optional fetch options.
 * @returns A promise that resolves to the created UserAccountAdminViewDTO.
 */
export async function createUserAccountAdmin(
  userData: UserAccountCreationRequestDTO,
  options: FetchOptions = {}
): Promise<UserAccountAdminViewDTO> {
  return fetchWithAuth<UserAccountAdminViewDTO>(
    API_ENDPOINTS.ADMIN.USERS.CREATE,
    {
      method: "POST",
      body: userData,
      ...options,
    }
  );
}

/**
 * Updates an existing user account by an administrator. Requires ADMIN role.
 * Corresponds to: PUT /api/admin/users/{userId}
 * Only non-null fields in the userData will be considered for update.
 * @param userId - UUID of the user account to update.
 * @param userData - Fields of the user account to update.
 * @param options - Optional fetch options.
 * @returns A promise that resolves to the updated UserAccountAdminViewDTO.
 */
export async function updateUserAccountAdmin(
  userId: string,
  userData: UserAccountUpdateRequestDTO,
  options: FetchOptions = {}
): Promise<UserAccountAdminViewDTO> {
  return fetchWithAuth<UserAccountAdminViewDTO>(
    API_ENDPOINTS.ADMIN.USERS.UPDATE_BY_ID(userId),
    {
      method: "PUT",
      body: userData,
      ...options,
    }
  );
}

/**
 * Soft-deletes a user account by an administrator. Requires ADMIN role.
 * Corresponds to: DELETE /api/admin/users/{userId}
 * @param userId - UUID of the user account to soft-delete.
 * @param options - Optional fetch options.
 * @returns A promise that resolves to a MessageResponse.
 */
export async function deleteUserAccountAdmin(
  userId: string,
  options: FetchOptions = {}
): Promise<MessageResponse> {
  return fetchWithAuth<MessageResponse>(
    API_ENDPOINTS.ADMIN.USERS.DELETE_BY_ID(userId),
    {
      method: "DELETE",
      ...options,
    }
  );
}
