import { getEoaPrivateKey } from '../../lib/config.js';
import { resolveNode } from '../../lib/node-router.js';
import { callContractView as callContractViewBySdk, sendContractTransaction as sendContractTransactionBySdk } from '../../lib/sdk-client.js';
import { validateChainTargetInput, validateContractAddress, validateMethodName } from '../../lib/validators.js';
import { executeWithResponse } from './common.js';
import type { CallContractViewInput, SendContractTransactionInput, SkillResponse } from '../../lib/types.js';
import { resolvePrivateKeyContext } from '../../lib/signer-context.js';

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
    const resolved = resolvePrivateKeyContext({
      signerMode: 'auto',
      ...(input.signer || {}),
      ...(input.signerContext || {}),
      privateKey: getEoaPrivateKey(input.privateKey),
    });
    const privateKey = resolved.privateKey;

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
