import { z } from 'zod';

// ============================================
// Document API Schemas
// ============================================

export const documentListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const documentEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const createDocumentBodySchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(10485760), // 10MB max
  writer: z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION']).default('LOGOS'),
});

export const updateDocumentBodySchema = createDocumentBodySchema.partial().required({ path: true, content: true });

// ============================================
// Vault Reconcile Schemas
// ============================================

export const vaultReconcileBodySchema = z.object({
  path: z.string().optional(),
});

// ============================================
// Memory API Schemas
// ============================================

export const memorySearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.75),
});

// Episodic Memory
export const writeEpisodicBodySchema = z.object({
  type: z.string().min(1).max(100),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.number().int().positive().optional(),
  session_id: z.string().optional(),
  source: z.string().optional(),
  writer_identity: z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION']).default('LOGOS'),
});

export const getEpisodicByIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const recentEpisodicQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// Semantic Memory
export const writeSemanticBodySchema = z.object({
  fact: z.string().min(1),
  category: z.string().max(100).optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  source: z.string().optional(),
  writer_identity: z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION']).default('LOGOS'),
});

export const getSemanticByIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Procedural Memory
export const writeProceduralBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  steps: z.string().min(1),
  triggers: z.string().optional(),
  writer_identity: z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION']).default('LOGOS'),
});

export const getProceduralByIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const proceduralUseBodySchema = z.object({
  success: z.boolean().default(true),
});

// Working Memory
export const writeWorkingBodySchema = z.object({
  session_id: z.string().min(1),
  key: z.string().min(1).max(200),
  value: z.string(),
  priority: z.number().int().default(0),
  expires_at: z.number().int().positive().optional(),
});

export const getWorkingParamSchema = z.object({
  sessionId: z.string().min(1),
  key: z.string().min(1).optional(),
});

export const updateWorkingBodySchema = z.object({
  value: z.string(),
});

export const deleteWorkingParamSchema = z.object({
  sessionId: z.string().min(1),
  key: z.string().min(1).optional(),
});

// ============================================
// Health & Version Response Schemas
// ============================================

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  service: z.string(),
  version: z.string(),
});

export const versionResponseSchema = z.object({
  version: z.string(),
  name: z.string(),
  activePhase: z.string(),
});

// ============================================
// Error Response Schema
// ============================================

export const errorResponseSchema = z.object({
  error: z.string(),
});

// ============================================
// Type exports
// ============================================

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type DocumentEventsQuery = z.infer<typeof documentEventsQuerySchema>;
export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;

export type VaultReconcileBody = z.infer<typeof vaultReconcileBodySchema>;

export type MemorySearchQuery = z.infer<typeof memorySearchQuerySchema>;

export type WriteEpisodicBody = z.infer<typeof writeEpisodicBodySchema>;
export type GetEpisodicByIdParam = z.infer<typeof getEpisodicByIdParamSchema>;
export type RecentEpisodicQuery = z.infer<typeof recentEpisodicQuerySchema>;

export type WriteSemanticBody = z.infer<typeof writeSemanticBodySchema>;
export type GetSemanticByIdParam = z.infer<typeof getSemanticByIdParamSchema>;

export type WriteProceduralBody = z.infer<typeof writeProceduralBodySchema>;
export type GetProceduralByIdParam = z.infer<typeof getProceduralByIdParamSchema>;
export type ProceduralUseBody = z.infer<typeof proceduralUseBodySchema>;

export type WriteWorkingBody = z.infer<typeof writeWorkingBodySchema>;
export type GetWorkingParam = z.infer<typeof getWorkingParamSchema>;
export type UpdateWorkingBody = z.infer<typeof updateWorkingBodySchema>;
export type DeleteWorkingParam = z.infer<typeof deleteWorkingParamSchema>;

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type VersionResponse = z.infer<typeof versionResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;