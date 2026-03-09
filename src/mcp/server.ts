#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import packageJson from '../../package.json';
import {
  callContractView,
  estimateTransactionFee,
  getBlock,
  getBlockHeight,
  getChainStatus,
  getContractViewMethods,
  getSystemContractAddress,
  getTransactionResult,
  importNode,
  listNodes,
  sendContractTransaction,
} from '../../index.js';

const server = new McpServer({
  name: 'aelf-node-skill',
  version: packageJson.version,
});

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  read_only_hint: true,
} as const;

const LOCAL_WRITE_ANNOTATIONS = {
  destructiveHint: true,
  destructive_hint: true,
} as const;

const NETWORK_WRITE_ANNOTATIONS = {
  destructiveHint: true,
  destructive_hint: true,
  openWorldHint: true,
  side_effects_hint: true,
} as const;

function asMcpResult(data: unknown) {
  if (
    data &&
    typeof data === 'object' &&
    'ok' in data &&
    (data as { ok?: unknown }).ok === false
  ) {
    const record = data as Record<string, unknown>;
    const error =
      record.error && typeof record.error === 'object'
        ? (record.error as Record<string, unknown>)
        : {};
    const code = typeof error.code === 'string' ? error.code : 'UNKNOWN_ERROR';
    const message = typeof error.message === 'string' ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text' as const,
          text: `[ERROR] ${code}: ${message}`,
        },
        {
          type: 'text' as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
      isError: true as const,
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

const chainTargetSchema = {
  chainId: z.string().optional().describe('Chain id, e.g. AELF or tDVV'),
  nodeId: z.string().optional().describe('Optional imported node id'),
  rpcUrl: z.string().optional().describe('Direct rpc url override, only http/https is accepted'),
};

const signerContextSchema = z
  .object({
    signerMode: z.enum(['auto', 'explicit', 'context', 'env', 'daemon']).optional(),
    walletType: z.enum(['EOA', 'CA']).optional(),
    address: z.string().optional(),
    password: z.string().optional(),
    privateKey: z.string().optional(),
    caHash: z.string().optional(),
    caAddress: z.string().optional(),
    network: z.enum(['mainnet', 'testnet']).optional(),
  })
  .optional()
  .describe('Optional signer context. auto tries explicit → active context → env.');

server.registerTool(
  'aelf_get_chain_status',
  {
    description: 'Get chain status from AElf node.',
    inputSchema: chainTargetSchema,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await getChainStatus(input)),
);

server.registerTool(
  'aelf_get_block_height',
  {
    description: 'Get block height from AElf node.',
    inputSchema: chainTargetSchema,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await getBlockHeight(input)),
);

server.registerTool(
  'aelf_get_block',
  {
    description: 'Get block detail by block hash.',
    inputSchema: {
      ...chainTargetSchema,
      blockHash: z.string().describe('Block hash'),
      includeTransactions: z.boolean().optional().default(false),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await getBlock(input)),
);

server.registerTool(
  'aelf_get_transaction_result',
  {
    description: 'Get transaction result by tx id.',
    inputSchema: {
      ...chainTargetSchema,
      transactionId: z.string().describe('Transaction id'),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await getTransactionResult(input)),
);

server.registerTool(
  'aelf_get_contract_view_methods',
  {
    description: 'List view methods of a contract. This tool uses REST adapter path /api/contract/contractViewMethodList.',
    inputSchema: {
      ...chainTargetSchema,
      contractAddress: z.string().describe('Contract address'),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await getContractViewMethods(input)),
);

server.registerTool(
  'aelf_get_system_contract_address',
  {
    description: 'Get system contract address by contract name.',
    inputSchema: {
      ...chainTargetSchema,
      contractName: z.string().describe('Contract name, e.g. AElf.ContractNames.Token'),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await getSystemContractAddress(input)),
);

server.registerTool(
  'aelf_call_contract_view',
  {
    description: 'Call contract view method via aelf-sdk contractAt.',
    inputSchema: {
      ...chainTargetSchema,
      contractAddress: z.string().describe('Contract address'),
      methodName: z.string().describe('Method name'),
      params: z.record(z.unknown()).optional(),
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await callContractView(input)),
);

server.registerTool(
  'aelf_send_contract_transaction',
  {
    description: 'Send contract transaction via aelf-sdk with env-based signer and optional tx polling.',
    inputSchema: {
      ...chainTargetSchema,
      contractAddress: z.string().describe('Contract address'),
      methodName: z.string().describe('Method name'),
      params: z.record(z.unknown()).optional(),
      waitForMined: z.boolean().optional().default(true),
      maxRetries: z.number().int().optional().default(20),
      retryIntervalMs: z.number().int().optional().default(1500),
      signer: signerContextSchema,
      signerContext: signerContextSchema,
    },
    annotations: NETWORK_WRITE_ANNOTATIONS,
  },
  async input => asMcpResult(await sendContractTransaction(input)),
);

server.registerTool(
  'aelf_estimate_transaction_fee',
  {
    description: 'Estimate transaction fee. Uses REST endpoint first and falls back to sdk calculateTransactionFee.',
    inputSchema: {
      ...chainTargetSchema,
      rawTransaction: z.string().optional(),
      contractAddress: z.string().optional(),
      methodName: z.string().optional(),
      params: z.record(z.unknown()).optional(),
      signer: signerContextSchema,
      signerContext: signerContextSchema,
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => asMcpResult(await estimateTransactionFee(input)),
);

server.registerTool(
  'aelf_import_node',
  {
    description: 'Import or update a custom node profile.',
    inputSchema: {
      id: z.string().describe('Node id'),
      chainId: z.string().describe('Chain id'),
      rpcUrl: z.string().describe('RPC URL'),
      enabled: z.boolean().optional().default(true),
    },
    annotations: LOCAL_WRITE_ANNOTATIONS,
  },
  async input => asMcpResult(await importNode(input)),
);

server.registerTool(
  'aelf_list_nodes',
  {
    description: 'List imported nodes and all available nodes after priority merge.',
    inputSchema: {},
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async () => asMcpResult(await listNodes()),
);

const transport = new StdioServerTransport();
await server.connect(transport);
