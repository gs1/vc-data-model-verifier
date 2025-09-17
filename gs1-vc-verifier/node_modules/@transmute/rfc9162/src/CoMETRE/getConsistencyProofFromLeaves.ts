import { CoMETREInclusionProof } from './getInclusionProofForLeaf'

import { getRootFromLeaves } from './getRootFromLeaves'
import { CUT } from '../RFC9162/CUT'

import { highestPowerOf2LessThanN } from '../RFC9162/highestPowerOf2LessThanN'

export type CoMETREConsistencyProof = {
  log_id: string
  tree_size_1: number
  tree_size_2: number
  consistency_path: Uint8Array[]
}

const SUBPROOF = async (m: number, D_n: Uint8Array[], b: boolean): Promise<Uint8Array[]> => {
  const n = D_n.length
  if (m === n) {
    return [await getRootFromLeaves(D_n)]
  }
  if (m < n) {
    const k = highestPowerOf2LessThanN(n)
    // If m <= k, the right subtree entries D[k:n] only exist in the current tree.
    if (m <= k) {
      // We prove that the left subtree entries D[0:k] are consistent
      // and add a commitment to D[k:n]:
      // SUBPROOF(m, D_n, b) = SUBPROOF(m, D[0:k], b) : MTH(D[k:n])
      const left = CUT(D_n, 0, k)
      const first = await SUBPROOF(m, left, b)
      const second = await getRootFromLeaves(CUT(D_n, k, n))
      return first.concat(second)
    } else if (m > k) {
      // If m > k, the left subtree entries D[0:k] are identical in both
      // trees.  We prove that the right subtree entries D[k:n] are consistent
      // and add a commitment to D[0:k]:
      const right = CUT(D_n, k, n)
      const first = await SUBPROOF(m - k, right, false)
      const second = await getRootFromLeaves(CUT(D_n, 0, k))
      return first.concat(second)
    }
  }
  throw new Error('m cannot be greater than n')
}

export const getConsistencyProofFromLeaves = async (
  previousInclusionProof: CoMETREInclusionProof,
  currentLeaves: Uint8Array[],
): Promise<CoMETREConsistencyProof> => {
  const tree_size_1 = previousInclusionProof.tree_size
  const tree_size_2 = currentLeaves.length
  const consistency_path = await SUBPROOF(
    previousInclusionProof.tree_size,
    currentLeaves,
    true,
  )
  return {
    log_id: '',
    tree_size_1,
    tree_size_2,
    consistency_path,
  }
}
