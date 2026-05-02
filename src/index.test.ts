import { beforeEach, describe, expect, it, vi } from "vitest";
import { NMem } from "./index.js";
import type {
  AppendThreadMessagesRequest,
  CreateSpaceRequest,
  CreateThreadRequest,
  DeleteThreadQueryParams,
  DeleteThreadsRequest,
  ReconcileThreadTailRequest,
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

  describe("_threadExists", () => {
    it("returns true when thread exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await client._threadExists("thread-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: undefined,
        },
      );
      expect(result).toBe(true);
    });

    it("returns false when thread does not exist (404)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await client._threadExists("thread-1");

      expect(result).toBe(false);
    });

    it("throws error for non-404 failures", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client._threadExists("thread-1")).rejects.toThrow();
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

  describe("deleteThread", () => {
    it("deletes thread successfully without query params", async () => {
      const mockResponse = {
        message: "Thread deleted",
        deleted_messages: 5,
        deleted_memories: 0,
        cascade_deletion: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.deleteThread({ thread_id: "thread-1" }, {});

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: undefined,
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("deletes thread with cascade_delete_memories", async () => {
      const mockResponse = {
        message: "Thread deleted",
        deleted_messages: 5,
        deleted_memories: 3,
        cascade_deletion: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: DeleteThreadQueryParams = {
        cascade_delete_memories: true,
      };

      const result = await client.deleteThread(
        { thread_id: "thread-1" },
        query,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1?cascade_delete_memories=true",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: undefined,
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("deletes thread with space_id", async () => {
      const mockResponse = {
        message: "Thread deleted",
        deleted_messages: 5,
        deleted_memories: 0,
        cascade_deletion: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: DeleteThreadQueryParams = {
        space_id: "space-1",
      };

      const result = await client.deleteThread(
        { thread_id: "thread-1" },
        query,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1?space_id=space-1",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: undefined,
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("deletes thread with both query params", async () => {
      const mockResponse = {
        message: "Thread deleted",
        deleted_messages: 5,
        deleted_memories: 3,
        cascade_deletion: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: DeleteThreadQueryParams = {
        cascade_delete_memories: true,
        space_id: "space-1",
      };

      const result = await client.deleteThread(
        { thread_id: "thread-1" },
        query,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1?cascade_delete_memories=true&space_id=space-1",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: undefined,
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws CannotReachNMemError on network failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        client.deleteThread({ thread_id: "thread-1" }, {}),
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

  describe("appendThreadMessages", () => {
    it("appends messages successfully", async () => {
      const request: AppendThreadMessagesRequest = {
        messages: [
          {
            content: "New message",
            role: "user",
          },
        ],
      };

      const mockResponse = {
        success: true,
        thread_id: "thread-1",
        messages_added: 1,
        total_messages: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.appendThreadMessages(
        { thread_id: "thread-1" },
        request,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1/append",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("appends messages with deduplicate and idempotency_key", async () => {
      const request: AppendThreadMessagesRequest = {
        messages: [
          {
            content: "New message",
            role: "user",
          },
        ],
        deduplicate: false,
        idempotency_key: "key-123",
        space_id: "space-1",
      };

      const mockResponse = {
        success: true,
        thread_id: "thread-1",
        messages_added: 1,
        total_messages: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.appendThreadMessages(
        { thread_id: "thread-1" },
        request,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1/append",
        {
          method: "POST",
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
        client.appendThreadMessages(
          { thread_id: "thread-1" },
          { messages: [] },
        ),
      ).rejects.toThrow();
    });
  });

  describe("reconcileThreadTail", () => {
    it("reconciles thread tail successfully", async () => {
      const request: ReconcileThreadTailRequest = {
        messages: [
          {
            content: "Updated message",
            role: "assistant",
          },
        ],
        matched_count: 3,
      };

      const mockResponse = {
        success: true,
        thread_id: "thread-1",
        messages_replaced: 2,
        messages_added: 1,
        total_messages: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.reconcileThreadTail(
        { thread_id: "thread-1" },
        request,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1/reconcile-tail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("reconciles with expected_tail_ids", async () => {
      const request: ReconcileThreadTailRequest = {
        messages: [
          {
            content: "Updated message",
            role: "assistant",
          },
        ],
        matched_count: 3,
        expected_tail_ids: ["msg-1", "msg-2"],
      };

      const mockResponse = {
        success: true,
        thread_id: "thread-1",
        messages_replaced: 2,
        messages_added: 1,
        total_messages: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.reconcileThreadTail(
        { thread_id: "thread-1" },
        request,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:14242/threads/thread-1/reconcile-tail",
        {
          method: "POST",
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
        client.reconcileThreadTail(
          { thread_id: "thread-1" },
          { messages: [], matched_count: 0 },
        ),
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
