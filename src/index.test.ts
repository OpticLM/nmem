import { beforeEach, describe, expect, it, vi } from "vitest";
import { NMem } from "./index.js";
import type {
  CreateSpaceRequest,
  CreateThreadRequest,
  DeleteThreadsRequest,
} from "./schema.js";

describe("NMem", () => {
  let client: NMem;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    client = new NMem();
  });

  describe("constructor", () => {
    it("uses default baseUrl", () => {
      const instance = new NMem();
      expect(instance).toBeInstanceOf(NMem);
    });

    it("accepts custom baseUrl", () => {
      const instance = new NMem("http://custom:8080");
      expect(instance).toBeInstanceOf(NMem);
    });
  });

  describe("getSpaces", () => {
    it("fetches spaces successfully", async () => {
      const mockResponse = {
        enabled: true,
        spaces: [
          {
            id: "space-1",
            key: "key-1",
            name: "Test Space",
            defaultRetrievalMode: "strict",
            observed: false,
            hasProfile: true,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSpaces();

      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:14242/spaces", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it("throws CannotReachNMemError on network failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(client.getSpaces()).rejects.toThrow();
    });

    it("throws MalformedResponseError on invalid schema", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enabled: "not-a-boolean" }),
      });

      await expect(client.getSpaces()).rejects.toThrow();
    });
  });

  describe("createSpace", () => {
    it("creates space successfully", async () => {
      const request: CreateSpaceRequest = {
        name: "New Space",
        description: "Test description",
      };

      const mockResponse = {
        enabled: true,
        spaces: [
          {
            id: "space-1",
            key: null,
            name: "New Space",
            description: "Test description",
            defaultRetrievalMode: "strict",
            observed: false,
            hasProfile: true,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.createSpace(request);

      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:14242/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      expect(result).toEqual(mockResponse);
    });

    it("throws CannotReachNMemError on network failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(client.createSpace({ name: "Test" })).rejects.toThrow();
    });
  });

  describe("createThread", () => {
    it("creates thread successfully", async () => {
      const request: CreateThreadRequest = {
        thread_id: "thread-1",
        title: "Test Thread",
        messages: [
          {
            content: "Hello",
            role: "user",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await client.createThread(request);

      expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:14242/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      expect(result).toBeNull();
    });

    it("throws CannotReachNMemError on network failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        client.createThread({
          thread_id: "thread-1",
          messages: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("deleteThreds", () => {
    it("deletes threads successfully", async () => {
      const request: DeleteThreadsRequest = {
        thread_ids: ["thread-1", "thread-2"],
      };

      const mockResponse = {
        message: "Deleted successfully",
        deleted_count: 2,
        failed_count: 0,
        total_deleted_messages: 5,
        total_deleted_memories: 3,
        cascade_deletion: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.deleteThreds(request);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/bulk",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws CannotReachNMemError on network failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        client.deleteThreds({ thread_ids: ["thread-1"] }),
      ).rejects.toThrow();
    });

    it("throws MalformedResponseError on invalid schema", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "response" }),
      });

      await expect(
        client.deleteThreds({ thread_ids: ["thread-1"] }),
      ).rejects.toThrow();
    });
  });

  describe("custom baseUrl", () => {
    it("uses custom baseUrl for requests", async () => {
      const customClient = new NMem("http://custom:9999");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enabled: false }),
      });

      await customClient.getSpaces();

      expect(mockFetch).toHaveBeenCalledWith("http://custom:9999/spaces", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: undefined,
      });
    });
  });
});
