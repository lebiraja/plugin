import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { providerApi } from "./providers";
import { apiClient } from "./client";

describe("providerApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("list returns providers and encryption flag", async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { providers: [{ id: "openai" }], encryption_available: true },
    });
    const res = await providerApi.list();
    expect(apiClient.get).toHaveBeenCalledWith("/providers");
    expect(res.encryption_available).toBe(true);
    expect(res.providers).toHaveLength(1);
  });

  it("upsert posts the provider payload (key is write-only)", async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "groq", has_key: true, masked_key: "gsk…1234" },
    });
    const res = await providerApi.upsert({
      id: "groq",
      api_key: "gsk-secret",
      enabled: true,
    });
    expect(apiClient.post).toHaveBeenCalledWith("/providers", {
      id: "groq",
      api_key: "gsk-secret",
      enabled: true,
    });
    // Response never contains the plaintext key.
    expect(JSON.stringify(res)).not.toContain("gsk-secret");
  });

  it("test pings the provider test endpoint", async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ok: true, status: 200 },
    });
    const res = await providerApi.test("openai");
    expect(apiClient.post).toHaveBeenCalledWith("/providers/openai/test");
    expect(res.ok).toBe(true);
  });

  it("remove deletes the provider", async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true },
    });
    const res = await providerApi.remove("custom");
    expect(apiClient.delete).toHaveBeenCalledWith("/providers/custom");
    expect(res.success).toBe(true);
  });
});
