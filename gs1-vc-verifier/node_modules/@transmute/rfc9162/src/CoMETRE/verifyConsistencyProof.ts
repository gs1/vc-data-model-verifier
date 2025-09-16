import { HASH } from '../RFC9162/HASH'
import { CONCAT } from '../RFC9162/CONCAT'
import { hexToBin } from '../RFC9162/hexToBin'
import { LSB } from '../RFC9162/LSB'
import { EQUAL } from '../RFC9162/EQUAL'

const prefix = hexToBin('01')

import { EXACT_POWER_OF_2 } from '../RFC9162/EXACT_POWER_OF_2'
import { CoMETREConsistencyProof } from './getConsistencyProofFromLeaves'

export const verifyConsistencyProof = async (
  first_tree_root: Uint8Array,
  first_tree_size: number,
  second_tree_root: Uint8Array,
  second_tree_size: number,
  proof: CoMETREConsistencyProof, // for first_tree
): Promise<boolean> => {
  const { consistency_path } = proof
  // 1.  If consistency_path is an empty array, stop and fail the proof verification.
  if (consistency_path.length === 0) {
    return false
  }
  // 2.  If first is an exact power of 2, then prepend first_hash to the consistency_path array.
  if (EXACT_POWER_OF_2(first_tree_size)) {
    // hmm erata?
    // consistency_proof_v2.unshift(first_tree_root)
  }
  let fn = first_tree_size - 1
  let sn = second_tree_size - 1
  // 4.  If LSB(fn) is set, then right-shift both fn and sn equally until LSB(fn) is not set.
  while (LSB(fn)) {
    fn = fn >> 1
    sn = sn >> 1
  }
  // Set both fr and sr to the first value in the consistency_path array.
  let fr = consistency_path[0]
  let sr = consistency_path[0]
  // 6.  For each subsequent value c in the consistency_path array:
  for (let i = 1; i < consistency_path.length; i++) {
    const c = consistency_path[i]
    // a.  If sn is 0, then stop the iteration and fail the proof
    //        verification.
    if (sn === 0) {
      return false
    }
    // If LSB(fn) is set, or if fn is equal to sn, then:
    if (LSB(fn) || fn === sn) {
      // i.    Set fr to HASH(0x01 || c || fr).
      fr = await HASH(CONCAT(prefix, CONCAT(c, fr)))
      // ii.   Set sr to HASH(0x01 || c || sr).
      sr = await HASH(CONCAT(prefix, CONCAT(c, sr)))
      // iii.  If LSB(fn) is not set, then right-shift both fn and sn
      //            equally until either LSB(fn) is set or fn is 0.
      while (!LSB(fn) && fn !== 0) {
        fn = fn >> 1
        sn = sn >> 1
      }
    } else {
      // Otherwise:
      // i.  Set sr to HASH(0x01 || sr || c).
      sr = await HASH(CONCAT(prefix, CONCAT(sr, c)))
    }
    fn = fn >> 1
    sn = sn >> 1
  }
  const sn_is_zero = sn === 0
  if (!sn_is_zero) {
    throw new Error('sn is not zero, proof validation failed.')
  }
  const fr_is_first_hash = EQUAL(fr, first_tree_root)
  const sr_is_second_hash = EQUAL(sr, second_tree_root)
  return fr_is_first_hash && sr_is_second_hash
}
