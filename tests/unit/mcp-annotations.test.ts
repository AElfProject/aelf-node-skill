import { describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const READ_TOOLS = [
  'aelf_get_chain_status',
  'aelf_get_block_height',
  'aelf_get_block',
  'aelf_get_transaction_result',
  'aelf_get_contract_view_methods',
  'aelf_get_system_contract_address',
  'aelf_call_contract_view',
  'aelf_estimate_transaction_fee',
  'aelf_list_nodes',
];

describe('MCP tool annotations', () => {
  test('read, local write, and network write tools expose the expected annotations', async () => {
    const transport = new StdioClientTransport({
      command: 'bun',
      args: ['run', 'src/mcp/server.ts'],
      cwd: process.cwd(),
    });
    const client = new Client(
      {
        name: 'aelf-node-annotations-test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      },
    );

    try {
      await client.connect(transport);
      const result = await client.listTools();

      READ_TOOLS.forEach(name => {
        const tool = result.tools.find(item => item.name === name);
        expect(tool?.annotations?.readOnlyHint).toBe(true);
        expect(tool?.annotations?.destructiveHint).not.toBe(true);
      });

      const localWrite = result.tools.find(tool => tool.name === 'aelf_import_node');
      expect(localWrite?.annotations?.destructiveHint).toBe(true);
      expect(localWrite?.annotations?.openWorldHint).not.toBe(true);

      const networkWrite = result.tools.find(tool => tool.name === 'aelf_send_contract_transaction');
      expect(networkWrite?.annotations?.destructiveHint).toBe(true);
      expect(networkWrite?.annotations?.openWorldHint).toBe(true);
    } finally {
      await client.close();
    }
  });
});
