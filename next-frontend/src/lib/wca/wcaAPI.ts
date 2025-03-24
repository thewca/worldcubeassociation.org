import createClient from "openapi-fetch";
import type { paths as externalPaths } from "./wcaSchema"; // generated by openapi-typescript
import type { paths as internalPaths } from "./internalSchema"; // generated by openapi-typescript

export const internalClient = createClient<internalPaths>({
  baseUrl: "http://wca_on_rails:3000/api/internal/",
  headers: { "Content-Type": "application/json" },
});
export const serverClient = createClient<externalPaths>({
  baseUrl: "http://wca_on_rails:3000/api/v0/",
  headers: { "Content-Type": "application/json" },
});
export const unauthenticatedClient = createClient<externalPaths>({
  baseUrl: "http://localhost:3000/api/v0/",
  headers: { "Content-Type": "application/json" },
});
export const authenticatedClient = (token: string) =>
  createClient<externalPaths>({
    baseUrl: "http://localhost:3000/api/v0/",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
