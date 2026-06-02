import { describe, it, expect, beforeEach } from "vitest";
import {
  apiClient,
  configureApi,
  getApiBaseUrl,
  DEFAULT_API_BASE_URL,
} from "./client";

describe("apiClient configuration", () => {
  beforeEach(() => {
    apiClient.defaults.baseURL = DEFAULT_API_BASE_URL;
  });

  it("defaults to /api when VITE_API_URL is unset", () => {
    expect(getApiBaseUrl()).toBe("/api");
  });

  it("configureApi overrides the base URL at runtime", () => {
    configureApi({ baseUrl: "https://api.example.com" });
    expect(getApiBaseUrl()).toBe("https://api.example.com");
    expect(apiClient.defaults.baseURL).toBe("https://api.example.com");
  });
});
