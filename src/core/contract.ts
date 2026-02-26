import { getEoaPrivateKey } from '../../lib/config.js';
import { resolveNode } from '../../lib/node-router.js';
import { callContractView as callContractViewBySdk, sendContractTransaction as sendContractTransactionBySdk } from '../../lib/sdk-client.js';
import { validateChainTargetInput, validateContractAddress, validateMethodName } from '../../lib/validators.js';
import { executeWithResponse } from './common.js';
import type { CallContractViewInput, SendContractTransactionInput, SkillResponse } from '../../lib/types.js';

export async function callContractView(input: CallContractViewInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    validateContractAddress(input.contractAddress);
    validateMethodName(input.methodName);

    const { node } = await resolveNode(input);
    return callContractViewBySdk(node.rpcUrl, input.contractAddress, input.methodName, input.params || {});
  }, 'CALL_CONTRACT_VIEW_FAILED');
}

export async function sendContractTransaction(input: SendContractTransactionInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    validateContractAddress(input.contractAddress);
    validateMethodName(input.methodName);

    const { node } = await resolveNode(input);
    const privateKey = getEoaPrivateKey(input.privateKey);
    if (!privateKey) {
      throw new Error('AELF_PRIVATE_KEY is required for write operations');
    }

    return sendContractTransactionBySdk(
      node.rpcUrl,
      input.contractAddress,
      input.methodName,
      input.params || {},
      privateKey,
      input.waitForMined !== false,
      input.maxRetries ?? 20,
      input.retryIntervalMs ?? 1_500,
    );
  }, 'SEND_CONTRACT_TRANSACTION_FAILED');
}
