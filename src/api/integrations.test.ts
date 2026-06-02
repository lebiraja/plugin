import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./client", () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { integrationsApi } from "./integrations";
import { apiClient } from "./client";

describe("integrationsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getSearch fetches the masked integration", async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { provider: "serper", has_value: true, masked_value: "ser…1234" },
    });
    const res = await integrationsApi.getSearch();
    expect(apiClient.get).toHaveBeenCalledWith("/integrations/search");
    expect(res.has_value).toBe(true);
  });

  it("setSearchKey PUTs the plaintext key (response stays masked)", async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { has_value: true, masked_value: "ser…1234" },
    });
    const res = await integrationsApi.setSearchKey("serper-secret-key");
    expect(apiClient.put).toHaveBeenCalledWith("/integrations/search", {
      api_key: "serper-secret-key",
    });
    expect(JSON.stringify(res)).not.toContain("serper-secret-key");
  });

  it("deleteSearchKey removes the key", async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true },
    });
    const res = await integrationsApi.deleteSearchKey();
    expect(apiClient.delete).toHaveBeenCalledWith("/integrations/search");
    expect(res.success).toBe(true);
  });
});
