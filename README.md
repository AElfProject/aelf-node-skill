# AElf Node Skill

[English](./README.md) | [中文](./README.zh-CN.md)

[![Unit Tests](https://github.com/AElfProject/aelf-node-skill/actions/workflows/test.yml/badge.svg)](https://github.com/AElfProject/aelf-node-skill/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://AElfProject.github.io/aelf-node-skill/coverage.json)](https://AElfProject.github.io/aelf-node-skill/coverage.json)

AElf Node Skill provides MCP, CLI, and SDK interfaces for AElf public nodes with `REST for reads, SDK for contract execution, and selective fallback for fee estimate`.

## Features

- Read: chain status, block height, block detail, transaction result
- Contract metadata: view methods and system contract address (REST adapter)
- Contract execution: view call and send transaction (SDK)
- Fee estimate: REST first, SDK fallback
- Node registry: import and list custom nodes

## Default Nodes

- `AELF`: `https://aelf-public-node.aelf.io`
- `tDVV`: `https://tdvv-public-node.aelf.io`

## Install

```bash
bun install
```

## Usage

### MCP

```bash
bun run mcp
```

### CLI

```bash
bun run cli get-chain-status --chain-id AELF
```

### OpenClaw

```bash
bun run build:openclaw
bun run build:openclaw:check
```

## Quick Start

```bash
# MCP server
bun run mcp

# CLI
bun run cli get-chain-status --chain-id AELF

# Unit tests
bun run test:unit
```

## Setup CLI

This repository includes a one-command setup CLI for Claude, Cursor, and OpenClaw.

```bash
bun run setup claude
bun run setup cursor
bun run setup cursor --global
bun run setup openclaw
bun run setup openclaw --config-path /path/to/openclaw-config.json
bun run setup list
bun run setup uninstall claude
bun run setup uninstall cursor --global
bun run setup uninstall openclaw --config-path /path/to/openclaw-config.json
```

Installed package users can also run:

```bash
aelf-node-setup claude
```

## MCP Config Example

Reference file: [`mcp-config.example.json`](./mcp-config.example.json)

```json
{
  "mcpServers": {
    "aelf-node-skill": {
      "command": "bun",
      "args": ["run", "/ABSOLUTE/PATH/TO/src/mcp/server.ts"],
      "env": {
        "AELF_PRIVATE_KEY": "your_private_key_here"
      }
    }
  }
}
```

## Environment

Copy and edit:

```bash
cp .env.example .env
```

- `AELF_PRIVATE_KEY`: required for write operations
- `AELF_PRIVATE_KEY` is read from environment only in MCP mode (no private key tool input)
- `AELF_NODE_AELF_RPC_URL`: optional override for AELF node
- `AELF_NODE_TDVV_RPC_URL`: optional override for tDVV node
- `AELF_NODE_REGISTRY_PATH`: optional custom registry path
- `AELF_SDK_INSTANCE_CACHE_MAX`: optional max SDK instance cache size (default `32`)
- `AELF_SDK_CONTRACT_CACHE_MAX`: optional max SDK contract cache size (default `256`)
- `AELF_REST_CLIENT_CACHE_MAX`: optional max REST client cache size (default `64`)

## Tool List

MCP tool names:

- `aelf_get_chain_status`
- `aelf_get_block_height`
- `aelf_get_block`
- `aelf_get_transaction_result`
- `aelf_get_contract_view_methods`
- `aelf_get_system_contract_address`
- `aelf_call_contract_view`
- `aelf_send_contract_transaction`
- `aelf_estimate_transaction_fee`
- `aelf_import_node`
- `aelf_list_nodes`

## Architecture

- `src/core/`: business orchestration
- `lib/sdk-client.ts`: `aelf-sdk` wrapper
- `lib/rest-client.ts`: REST adapter with normalized errors
- `lib/node-router.ts`: node resolution and fallback
- `src/mcp/server.ts`: MCP adapter
- `aelf_node_skill.ts`: CLI adapter
- `index.ts`: SDK exports

## Testing

```bash
bun run test
bun run test:coverage:ci
```

## Security

- Never put `AELF_PRIVATE_KEY` in prompts or channel outputs.
- Use environment variables for all secrets.

## License

MIT
