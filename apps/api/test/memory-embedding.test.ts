import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression for gate §7: procedural embedding input must interpolate
// `${memory.name} ${memory.description ?? ''} ${memory.steps} ${memory.triggers ?? ''}`

const embedSpy = vi.fn(async (_text: string) => new Float32Array([0.1, 0.2, 0.3]));

vi.mock('../src/embeddings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/embeddings')>();
  return {
    ...actual,
    generateEmbedding: (text: string) => embedSpy(text),
  };
});

// Stub db so writeProcedural never touches sqlite
vi.mock('../src/db', () => ({
  db: { prepare: () => ({ run: () => ({}), get: () => undefined, all: () => [] }) },
}));

import { writeProcedural } from '../src/memory';

describe('procedural embedding input interpolation', () => {
  beforeEach(() => embedSpy.mockClear());

  it('interpolates name + description + steps + triggers', async () => {
    await writeProcedural({
      name: 'deploy',
      description: 'ship it',
      steps: '1. build 2. push',
      triggers: 'on merge',
    } as any);
    expect(embedSpy).toHaveBeenCalledWith('deploy ship it 1. build 2. push on merge');
  });

  it('uses empty strings when description/triggers undefined', async () => {
    await writeProcedural({ name: 'n', steps: 's' } as any);
    expect(embedSpy).toHaveBeenCalledWith('n  s ');
  });
});
