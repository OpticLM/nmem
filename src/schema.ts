import { z } from "zod";

export const MemorySpaceUsageResponseSchema = z.object({
  memories: z.number().default(0),
  threads: z.number().default(0),
  sources: z.number().default(0),
  hasWorkingMemory: z.boolean().default(false),
});
export type MemorySpaceUsageResponse = z.infer<
  typeof MemorySpaceUsageResponseSchema
>;

export const MemorySpaceResponseSchema = z.object({
  id: z.string(),
  key: z.string().nullable().optional(),
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  sharedSpaceIds: z.array(z.string()).optional(),
  defaultRetrievalMode: z.string().default("strict"),
  usage: MemorySpaceUsageResponseSchema.optional(),
  observed: z.boolean().default(false),
  hasProfile: z.boolean().default(true),
});
export type MemorySpaceResponse = z.infer<typeof MemorySpaceResponseSchema>;

export const GetSpacesResponseSchema = z.object({
  enabled: z.boolean().default(false),
  spaces: z.array(MemorySpaceResponseSchema).optional(),
});
export type GetSpacesResponse = z.infer<typeof GetSpacesResponseSchema>;

export interface CreateSpaceRequest {
  name: string;
  id?: string | null;
  key?: string | null;
  description?: string | null;
  icon?: string | null;
  instructions?: string | null;
  sharedSpaceIds?: string[] | null;
  defaultRetrievalMode?: string | null;
}

export interface CreateThreadRequest {
  /**
   * Human-readable thread identifier
   */
  thread_id: string;

  /**
   * Thread title
   */
  title?: string | null;

  /**
   * Thread messages
   */
  messages: MessageCreateRequest[];
  participants?: string[];
  /**
   * Source system
   */
  source?: string | null;

  /**
   * Isolation space for this thread
   * @default `default`
   */
  space_id?: string;

  /**
   * Project identifier
   */
  project?: string | null;

  /**
   * Workspace path
   */
  workspace?: string | null;

  /**
   * Tool version
   */
  tool_version?: string | null;

  /**
   * Import timestamp
   */
  import_date?: /**
   * @format `date-time`
   */
  string | null;
  metadata?: Record<string, unknown>;
}

export interface MessageCreateRequest {
  /**
   * Message content
   */
  content: string;

  /**
   * Message role (user, assistant, system)
   */
  role: string;

  /**
   * Message timestamp
   */
  timestamp?: /**
   * @format `date-time`
   */
  string | null;
  metadata?: Record<string, unknown>;
}

export interface DeleteThreadsRequest {
  /**
   * List of thread IDs to delete
   */
  thread_ids: string[];
}

export const DeleteThreadsResponseSchema = z.looseObject({
  message: z.string(),
  deleted_count: z.number(),
  failed_count: z.number().default(0),
  total_deleted_messages: z.number().default(0),
  total_deleted_memories: z.number().default(0),
  cascade_deletion: z.boolean().default(false),
  results: z.array(z.record(z.string(), z.any())).optional(),
});
export type DeleteThreadsResponse = z.infer<typeof DeleteThreadsResponseSchema>;
