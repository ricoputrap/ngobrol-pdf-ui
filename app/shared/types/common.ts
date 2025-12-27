/**
 * Common types shared across the application
 */

/**
 * Loading state for async operations
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Timestamp fields
 */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}
