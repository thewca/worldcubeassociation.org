// Serializable stand-in for `Response`, which cannot cross a `"use cache"` boundary.
export interface ErrorDetails {
  status: number;
  url: string;
  statusText: string;
  requestId: string | null;
}

export const toErrorDetails = (response: Response): ErrorDetails => ({
  status: response.status,
  url: response.url,
  statusText: response.statusText,
  requestId: response.headers.get("x-request-id"),
});
