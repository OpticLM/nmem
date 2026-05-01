import type z from "zod";
import {
  type CreateSpaceRequest,
  type CreateThreadRequest,
  type DeleteThreadsRequest,
  type DeleteThreadsResponse,
  DeleteThreadsResponseSchema,
  type GetSpacesResponse,
  GetSpacesResponseSchema,
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
    responseSchema: TSchema,
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

  async createSpace(p: CreateSpaceRequest): Promise<GetSpacesResponse> {
    return await this.post("/spaces", p, GetSpacesResponseSchema);
  }

  async createThread(p: CreateThreadRequest): Promise<null> {
    await this.post("/threads", p);
    return null;
  }

  async deleteThreds(p: DeleteThreadsRequest): Promise<DeleteThreadsResponse> {
    return await this.delete("/threads/bulk", p, DeleteThreadsResponseSchema);
  }
}
