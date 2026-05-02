import type z from "zod";
import {
  type AppendThreadMessagesPathParams,
  type AppendThreadMessagesRequest,
  type AppendThreadMessagesResponse,
  AppendThreadMessagesResponseSchema,
  type CreateSpaceRequest,
  type CreateThreadRequest,
  type DeleteThreadPathParams,
  type DeleteThreadQueryParams,
  type DeleteThreadResponse,
  DeleteThreadResponseSchema,
  type DeleteThreadsRequest,
  type DeleteThreadsResponse,
  DeleteThreadsResponseSchema,
  type GetSpacesResponse,
  GetSpacesResponseSchema,
  type ReconcileThreadTailPathParams,
  type ReconcileThreadTailRequest,
  type ReconcileThreadTailResponse,
  ReconcileThreadTailResponseSchema,
} from "./schema.js";

export class CannotReachNMemError extends Error {
  public readonly response: Response;
  constructor(resp: Response, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.response = resp;

    Object.setPrototypeOf(this, CannotReachNMemError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class MalformedResponseError extends Error {
  public readonly data: unknown;
  constructor(data: unknown, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.data = data;

    Object.setPrototypeOf(this, MalformedResponseError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NMem {
  constructor(private baseUrl: string = "http://127.0.0.1:14242") {}

  private async fetch<TBody, TSchema extends z.ZodType = z.ZodType>(
    method: string,
    path: string,
    body: TBody | undefined,
    responseSchema?: TSchema,
  ): Promise<z.infer<TSchema>> {
    const b = body ? JSON.stringify(body) : undefined;
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: b,
    });

    if (!resp.ok) {
      throw new CannotReachNMemError(resp);
    }

    if (!responseSchema) {
      return null as z.infer<TSchema>;
    }

    const json = await resp.json();
    const parsed = await responseSchema.safeParseAsync(json);
    if (!parsed.success) {
      throw new MalformedResponseError(json);
    }

    return parsed.data;
  }

  private async get<TSchema extends z.ZodType = z.ZodType>(
    path: string,
    responseSchema?: TSchema,
  ): Promise<z.infer<TSchema>> {
    return await this.fetch("GET", path, undefined, responseSchema);
  }

  private async post<TBody, TSchema extends z.ZodType = z.ZodType>(
    path: string,
    body: TBody,
    responseSchema?: TSchema,
  ): Promise<z.infer<TSchema>> {
    return await this.fetch("POST", path, body, responseSchema);
  }

  private async delete<TBody, TSchema extends z.ZodType = z.ZodType>(
    path: string,
    body: TBody,
    responseSchema?: TSchema,
  ): Promise<z.infer<TSchema>> {
    return await this.fetch("DELETE", path, body, responseSchema);
  }

  async getSpaces(): Promise<GetSpacesResponse> {
    return await this.get("/spaces", GetSpacesResponseSchema);
  }

  async createSpace(r: CreateSpaceRequest): Promise<GetSpacesResponse> {
    return await this.post("/spaces", r, GetSpacesResponseSchema);
  }

  async _threadExists(thread_id: string): Promise<boolean> {
    try {
      await this.get(`/threads/${thread_id}`);
      return true;
    } catch (e) {
      if (e instanceof CannotReachNMemError) {
        if (e.response.status === 404) {
          return false;
        }
      }

      throw e;
    }
  }

  async createThread(r: CreateThreadRequest): Promise<null> {
    await this.post("/threads", r);
    return null;
  }

  async deleteThread(
    path: DeleteThreadPathParams,
    query: DeleteThreadQueryParams,
  ): Promise<DeleteThreadResponse> {
    const params = new URLSearchParams();
    if (query.cascade_delete_memories !== undefined) {
      params.append(
        "cascade_delete_memories",
        query.cascade_delete_memories ? "true" : "false",
      );
    }
    if (query.space_id) {
      params.append("space_id", query.space_id);
    }

    const paramsString = params.toString();
    const url =
      paramsString.length > 0
        ? `/threads/${path.thread_id}?${paramsString}`
        : `/threads/${path.thread_id}`;

    return await this.delete(url, undefined, DeleteThreadResponseSchema);
  }

  async deleteThreds(r: DeleteThreadsRequest): Promise<DeleteThreadsResponse> {
    return await this.delete("/threads/bulk", r, DeleteThreadsResponseSchema);
  }

  async appendThreadMessages(
    path: AppendThreadMessagesPathParams,
    r: AppendThreadMessagesRequest,
  ): Promise<AppendThreadMessagesResponse> {
    return await this.post(
      `/threads/${path.thread_id}/append`,
      r,
      AppendThreadMessagesResponseSchema,
    );
  }

  async reconcileThreadTail(
    path: ReconcileThreadTailPathParams,
    r: ReconcileThreadTailRequest,
  ): Promise<ReconcileThreadTailResponse> {
    return await this.post(
      `/threads/${path.thread_id}/reconcile-tail`,
      r,
      ReconcileThreadTailResponseSchema,
    );
  }
}
