import type { SerializedAppError } from "@servyn/core";

export type RoleContext = "customer" | "vendor" | "seller" | "admin";

export type ApiError = SerializedAppError;

export type ApiResponse<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: ApiError };
