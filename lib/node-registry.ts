import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { getRegistryPath } from './config.js';
import type { ImportNodeInput, NodeProfile, NodeRegistryFile } from './types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function defaultRegistry(): NodeRegistryFile {
  return { version: 1, nodes: [] };
}

function normalizeNode(node: NodeProfile): NodeProfile {
  return {
    ...node,
    chainId: node.chainId,
    enabled: node.enabled !== false,
    source: 'imported',
    updatedAt: node.updatedAt || nowIso(),
    createdAt: node.createdAt || nowIso(),
  };
}

export async function readNodeRegistry(): Promise<NodeRegistryFile> {
  const path = getRegistryPath();
  try {
    const text = await readFile(path, 'utf8');
    const parsed = JSON.parse(text) as NodeRegistryFile;
    if (!parsed || !Array.isArray(parsed.nodes)) {
      return defaultRegistry();
    }
    return {
      version: 1,
      nodes: parsed.nodes.map(normalizeNode),
    };
  } catch {
    return defaultRegistry();
  }
}

export async function writeNodeRegistry(file: NodeRegistryFile): Promise<void> {
  const path = getRegistryPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

export async function listImportedNodes(): Promise<NodeProfile[]> {
  const file = await readNodeRegistry();
  return file.nodes.map(normalizeNode);
}

export async function importNode(input: ImportNodeInput): Promise<NodeProfile> {
  const file = await readNodeRegistry();
  const nextNode: NodeProfile = normalizeNode({
    id: input.id,
    chainId: input.chainId,
    rpcUrl: input.rpcUrl,
    enabled: input.enabled !== false,
    source: 'imported',
    updatedAt: nowIso(),
    createdAt: nowIso(),
  });

  const index = file.nodes.findIndex(node => node.id === nextNode.id);
  if (index >= 0) {
    const createdAt = file.nodes[index].createdAt || nowIso();
    file.nodes[index] = { ...nextNode, createdAt, updatedAt: nowIso() };
  } else {
    file.nodes.push(nextNode);
  }

  await writeNodeRegistry(file);
  return nextNode;
}
