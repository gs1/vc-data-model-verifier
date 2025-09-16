import { CONCAT } from '../RFC9162/CONCAT'
import { hexToBin } from '../RFC9162/hexToBin'
import { HASH } from '../RFC9162/HASH'

import { CoMETREInclusionProof } from './getInclusionProofForLeaf'

export const getRootFromInclusionProof = async (
  leaf: Uint8Array,
  proof: CoMETREInclusionProof,
): Promise<Uint8Array> => {
  const { tree_size, leaf_index, inclusion_path } = proof
  if (leaf_index > tree_size) {
    throw new Error('leaf index is out of bound')
  }
  let fn = leaf_index
  let sn = tree_size - 1
  let r = leaf
  const prefix = hexToBin('01')
  for (const p of inclusion_path) {
    // a.  If sn is 0, then stop the iteration and fail the proof verification.
    if (sn === 0) {
      throw new Error('verification failed, sn is 0')
    }
    // b.  If LSB(fn) is set, or if fn is equal to sn, then:
    if (fn % 2 === 1 || fn === sn) {
      // i.   Set r to HASH(0x01 || p || r).
      r = await HASH(CONCAT(prefix, CONCAT(p, r)))
      // ii.  If LSB(fn) is not set, then right-shift both fn and sn
      // equally until either LSB(fn) is set or fn is 0.
      while (fn % 2 !== 1) {
        fn = fn >> 1
        sn = sn >> 1
        if (fn === 0) {
          break
        }
      }
      // Otherwise:
    } else {
      // i.  Set r to HASH(0x01 || r || p).
      r = await HASH(CONCAT(prefix, CONCAT(r, p)))
    }
    // c.  Finally, right-shift both fn and sn one time.
    fn = fn >> 1
    sn = sn >> 1
  }
  const sn_is_0 = sn === 0
  if (!sn_is_0) {
    throw new Error('sn is not zero, proof validation failed.')
  }
  return r
}
