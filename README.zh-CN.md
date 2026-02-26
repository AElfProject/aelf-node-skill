# AElf Node Skill

[中文](./README.zh-CN.md) | [English](./README.md)

AElf Node Skill 提供 MCP、CLI、SDK 三种接口，采用“读走 REST、合约执行走 SDK、手续费估算选择性 fallback”的架构访问 AElf 公共节点。

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

仓库内置一键 setup，支持 Claude、Cursor、OpenClaw。

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
        "AELF_PRIVATE_KEY": "your_private_key_here"
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

- `AELF_PRIVATE_KEY`：写操作必填
- MCP 模式仅从环境变量读取 `AELF_PRIVATE_KEY`（不接受 tool 入参传私钥）
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
