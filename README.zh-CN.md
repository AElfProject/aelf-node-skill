# AElf Node Skill

[中文](./README.zh-CN.md) | [English](./README.md)

[![Unit Tests](https://github.com/AElfProject/aelf-node-skill/actions/workflows/test.yml/badge.svg)](https://github.com/AElfProject/aelf-node-skill/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://AElfProject.github.io/aelf-node-skill/coverage.json)](https://AElfProject.github.io/aelf-node-skill/coverage.json)

AElf Node Skill 提供 MCP、CLI、SDK 三种接口，采用“读走 REST、合约执行走 SDK、手续费估算选择性 fallback”的架构访问 AElf 公共节点，并支持 OpenClaw 与 IronClaw 集成。

## 功能

- 链路读取：链状态、区块高度、区块详情、交易结果
- 合约元数据：View Methods 和 System Contract Address（REST adapter）
- 合约执行：View 调用与交易发送（SDK）
- 手续费估算：REST 优先，SDK 兜底
- 节点管理：导入与列出自定义节点

## 默认节点

- `AELF`: `https://aelf-public-node.aelf.io`
- `tDVV`: `https://tdvv-public-node.aelf.io`

## 安装

```bash
bun install
```

## 使用方式

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

## 快速开始

```bash
# 启动 MCP server
bun run mcp

# 使用 CLI
bun run cli get-chain-status --chain-id AELF

# 运行单测
bun run test:unit
```

## Setup CLI

仓库内置一键 setup，支持 Claude、Cursor、OpenClaw、IronClaw。

```bash
bun run setup claude
bun run setup cursor
bun run setup cursor --global
bun run setup ironclaw
bun run setup openclaw
bun run setup openclaw --config-path /path/to/openclaw-config.json
bun run setup list
bun run setup uninstall claude
bun run setup uninstall cursor --global
bun run setup uninstall ironclaw
bun run setup uninstall openclaw --config-path /path/to/openclaw-config.json
```

## IronClaw

```bash
bun run setup ironclaw
bun run setup uninstall ironclaw
```

IronClaw 安装会向 `~/.ironclaw/mcp-servers.json` 写入 stdio MCP entry，并把当前仓库的 `SKILL.md` 安装到 `~/.ironclaw/skills/aelf-node-skill/SKILL.md`。

关于 trust model 的说明：

- 如果要执行 `aelf_send_contract_transaction` 这类写能力，必须使用上面的 trusted skill 路径。
- 不要把 `~/.ironclaw/installed_skills/` 当成主安装路径，否则写操作的 approval 行为会不稳定。
- 当前 MCP server 会同时输出标准 MCP camelCase annotations 和 IronClaw 兼容 snake_case annotations，确保 IronClaw 能识别读写 hints。

最短 smoke test：

1. `bun run setup ironclaw`
2. 让 IronClaw 查询 `latest block height on AELF`
3. 再让它 `send a contract transaction`，确认执行前会出现 approval

安装后的包也可直接执行：

```bash
aelf-node-setup claude
```

## MCP 配置示例

参考文件：[`mcp-config.example.json`](./mcp-config.example.json)

```json
{
  "mcpServers": {
    "aelf-node-skill": {
      "command": "bun",
      "args": ["run", "/ABSOLUTE/PATH/TO/src/mcp/server.ts"],
      "env": {
        "AELF_PRIVATE_KEY": "可选_env_回退私钥",
        "PORTKEY_WALLET_PASSWORD": "可选钱包密码",
        "PORTKEY_CA_KEYSTORE_PASSWORD": "可选keystore密码"
      }
    }
  }
}
```

## 环境变量

复制并编辑：

```bash
cp .env.example .env
```

- `AELF_PRIVATE_KEY`：写操作的 env 回退私钥（可选，env 优先级最高）
- `PORTKEY_PRIVATE_KEY`：共享 skill 兼容的次级 env 回退私钥（可选）
- 写操作工具（`aelf_send_contract_transaction`、`aelf_estimate_transaction_fee`）按 `explicit -> context -> env` 解析 signer
- `PORTKEY_WALLET_PASSWORD`：EOA wallet context 的密码缓存（可选）
- `PORTKEY_CA_KEYSTORE_PASSWORD`：CA keystore context 的密码缓存（可选）
- `PORTKEY_SKILL_WALLET_CONTEXT_PATH`：active context 路径覆盖（默认 `~/.portkey/skill-wallet/context.v1.json`）
- `signerMode=daemon` 仅预埋接口，本轮返回 `SIGNER_DAEMON_NOT_IMPLEMENTED`
- `AELF_NODE_AELF_RPC_URL`：可选，覆盖 AELF 节点
- `AELF_NODE_TDVV_RPC_URL`：可选，覆盖 tDVV 节点
- `AELF_NODE_REGISTRY_PATH`：可选，自定义节点注册表路径
- `AELF_SDK_INSTANCE_CACHE_MAX`：可选，SDK 实例缓存上限（默认 `32`）
- `AELF_SDK_CONTRACT_CACHE_MAX`：可选，SDK 合约缓存上限（默认 `256`）
- `AELF_REST_CLIENT_CACHE_MAX`：可选，REST 客户端缓存上限（默认 `64`）

## Tool 列表

MCP tool 名称：

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

## 架构

- `src/core/`：业务编排
- `lib/sdk-client.ts`：`aelf-sdk` 封装
- `lib/rest-client.ts`：REST adapter + 错误归一
- `lib/node-router.ts`：链与节点路由/fallback
- `src/mcp/server.ts`：MCP 入口
- `aelf_node_skill.ts`：CLI 入口
- `index.ts`：SDK 导出

## 测试

```bash
bun run test
bun run test:coverage:ci
```

## 安全

- 不要在对话输出中暴露 `AELF_PRIVATE_KEY`。
- Active wallet context 不存明文私钥。
- 所有密钥均通过环境变量管理。

## License

MIT
