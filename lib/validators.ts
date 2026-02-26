import type { ChainTargetInput, ImportNodeInput } from './types.js';

const CHAIN_ID_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,31}$/;
const NODE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const CONTRACT_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{30,70}$/;

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

export function validateRpcUrl(rpcUrl: string, fieldName = 'rpcUrl'): string {
  const value = assertNonEmptyString(rpcUrl, fieldName);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must use http or https protocol`);
  }

  return value;
}

export function validateChainId(chainId: string, fieldName = 'chainId'): string {
  const value = assertNonEmptyString(chainId, fieldName);
  if (!CHAIN_ID_PATTERN.test(value)) {
    throw new Error(`${fieldName} format is invalid`);
  }
  return value;
}

export function validateNodeId(nodeId: string, fieldName = 'nodeId'): string {
  const value = assertNonEmptyString(nodeId, fieldName);
  if (!NODE_ID_PATTERN.test(value)) {
    throw new Error(`${fieldName} format is invalid`);
  }
  return value;
}

export function validateContractAddress(contractAddress: string, fieldName = 'contractAddress'): string {
  const value = assertNonEmptyString(contractAddress, fieldName);
  if (!CONTRACT_ADDRESS_PATTERN.test(value)) {
    throw new Error(`${fieldName} format is invalid`);
  }
  return value;
}

export function validateMethodName(methodName: string, fieldName = 'methodName'): string {
  return assertNonEmptyString(methodName, fieldName);
}

export function validateChainTargetInput(input: ChainTargetInput): void {
  if (input.rpcUrl !== undefined) {
    validateRpcUrl(input.rpcUrl, 'rpcUrl');
  }
  if (input.chainId !== undefined) {
    validateChainId(String(input.chainId), 'chainId');
  }
  if (input.nodeId !== undefined) {
    validateNodeId(input.nodeId, 'nodeId');
  }
}

export function validateNodeProfileInput(input: ImportNodeInput): void {
  validateNodeId(input.id, 'id');
  validateChainId(String(input.chainId), 'chainId');
  validateRpcUrl(input.rpcUrl, 'rpcUrl');
}

export function validateRequiredText(input: string, fieldName: string): string {
  return assertNonEmptyString(input, fieldName);
}
