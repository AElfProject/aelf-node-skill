import { describe, expect, it } from 'bun:test';
import {
  validateChainId,
  validateContractAddress,
  validateNodeId,
  validateRpcUrl,
} from '../../lib/validators.js';

describe('lib/validators', () => {
  it('accepts http and https rpc urls', () => {
    expect(validateRpcUrl('https://aelf-public-node.aelf.io')).toBe('https://aelf-public-node.aelf.io');
    expect(validateRpcUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000');
  });

  it('rejects non-http protocols', () => {
    expect(() => validateRpcUrl('file:///tmp/a')).toThrow('rpcUrl must use http or https protocol');
  });

  it('validates chainId, nodeId and contractAddress formats', () => {
    expect(validateChainId('AELF')).toBe('AELF');
    expect(validateNodeId('custom-node_1')).toBe('custom-node_1');
    expect(validateContractAddress('7RzVGiuVWkvL4VfVHdZfQF2Tri3sgLe9U991bohHFfSRZXuGX')).toBe(
      '7RzVGiuVWkvL4VfVHdZfQF2Tri3sgLe9U991bohHFfSRZXuGX',
    );
  });
});
