#!/usr/bin/env bun
import { Command } from 'commander';
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
} from './index.js';
import type { ChainTargetInput } from './lib/types.js';

function parseJson<T = Record<string, unknown>>(input?: string): T {
  if (!input) return {} as T;
  return JSON.parse(input) as T;
}

function targetFromOptions(opts: { chainId?: string; nodeId?: string; rpcUrl?: string }): ChainTargetInput {
  return {
    chainId: opts.chainId,
    nodeId: opts.nodeId,
    rpcUrl: opts.rpcUrl,
  };
}

async function printResult(result: unknown): Promise<void> {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const program = new Command();
program
  .name('aelf-node-skill')
  .description('AElf Node Skill CLI')
  .option('--chain-id <chainId>', 'Chain id, e.g. AELF or tDVV')
  .option('--node-id <nodeId>', 'Custom node id')
  .option('--rpc-url <rpcUrl>', 'Direct RPC URL');

program
  .command('get-chain-status')
  .action(async (_cmd, command) => {
    await printResult(await getChainStatus(targetFromOptions(command.parent?.opts() || {})));
  });

program
  .command('get-block-height')
  .action(async (_cmd, command) => {
    await printResult(await getBlockHeight(targetFromOptions(command.parent?.opts() || {})));
  });

program
  .command('get-block')
  .requiredOption('--block-hash <blockHash>', 'Block hash')
  .option('--include-transactions', 'Include tx list', false)
  .action(async (opts, command) => {
    await printResult(
      await getBlock({
        ...targetFromOptions(command.parent?.opts() || {}),
        blockHash: opts.blockHash,
        includeTransactions: opts.includeTransactions,
      }),
    );
  });

program
  .command('get-transaction-result')
  .requiredOption('--transaction-id <transactionId>', 'Transaction id')
  .action(async (opts, command) => {
    await printResult(
      await getTransactionResult({
        ...targetFromOptions(command.parent?.opts() || {}),
        transactionId: opts.transactionId,
      }),
    );
  });

program
  .command('get-contract-view-methods')
  .requiredOption('--contract-address <contractAddress>', 'Contract address')
  .action(async (opts, command) => {
    await printResult(
      await getContractViewMethods({
        ...targetFromOptions(command.parent?.opts() || {}),
        contractAddress: opts.contractAddress,
      }),
    );
  });

program
  .command('get-system-contract-address')
  .requiredOption('--contract-name <contractName>', 'Contract name, e.g. AElf.ContractNames.Token')
  .action(async (opts, command) => {
    await printResult(
      await getSystemContractAddress({
        ...targetFromOptions(command.parent?.opts() || {}),
        contractName: opts.contractName,
      }),
    );
  });

program
  .command('call-contract-view')
  .requiredOption('--contract-address <contractAddress>', 'Contract address')
  .requiredOption('--method-name <methodName>', 'Method name')
  .option('--params-json <paramsJson>', 'JSON object of method params')
  .action(async (opts, command) => {
    await printResult(
      await callContractView({
        ...targetFromOptions(command.parent?.opts() || {}),
        contractAddress: opts.contractAddress,
        methodName: opts.methodName,
        params: parseJson(opts.paramsJson),
      }),
    );
  });

program
  .command('send-contract-transaction')
  .requiredOption('--contract-address <contractAddress>', 'Contract address')
  .requiredOption('--method-name <methodName>', 'Method name')
  .option('--params-json <paramsJson>', 'JSON object of method params')
  .option('--private-key <privateKey>', 'EOA private key override')
  .option('--no-wait-for-mined', 'Return immediately after tx broadcast')
  .option('--max-retries <maxRetries>', 'Tx polling retries', '20')
  .option('--retry-interval-ms <retryIntervalMs>', 'Tx polling interval ms', '1500')
  .action(async (opts, command) => {
    await printResult(
      await sendContractTransaction({
        ...targetFromOptions(command.parent?.opts() || {}),
        contractAddress: opts.contractAddress,
        methodName: opts.methodName,
        params: parseJson(opts.paramsJson),
        privateKey: opts.privateKey,
        waitForMined: opts.waitForMined,
        maxRetries: Number(opts.maxRetries),
        retryIntervalMs: Number(opts.retryIntervalMs),
      }),
    );
  });

program
  .command('estimate-transaction-fee')
  .option('--raw-transaction <rawTransaction>', 'Signed raw tx hex')
  .option('--contract-address <contractAddress>', 'Contract address')
  .option('--method-name <methodName>', 'Method name')
  .option('--params-json <paramsJson>', 'JSON object of method params')
  .option('--private-key <privateKey>', 'EOA private key override')
  .action(async (opts, command) => {
    await printResult(
      await estimateTransactionFee({
        ...targetFromOptions(command.parent?.opts() || {}),
        rawTransaction: opts.rawTransaction,
        contractAddress: opts.contractAddress,
        methodName: opts.methodName,
        params: parseJson(opts.paramsJson),
        privateKey: opts.privateKey,
      }),
    );
  });

program
  .command('import-node')
  .requiredOption('--id <id>', 'Node id')
  .requiredOption('--chain-id <chainId>', 'Chain id')
  .requiredOption('--rpc-url <rpcUrl>', 'Node rpc url')
  .option('--disabled', 'Set node disabled', false)
  .action(async opts => {
    await printResult(
      await importNode({
        id: opts.id,
        chainId: opts.chainId,
        rpcUrl: opts.rpcUrl,
        enabled: !opts.disabled,
      }),
    );
  });

program
  .command('list-nodes')
  .action(async () => {
    await printResult(await listNodes());
  });

program.parseAsync(process.argv).catch(error => {
  process.stderr.write(`[ERROR] ${error?.message || String(error)}\n`);
  process.exit(1);
});
