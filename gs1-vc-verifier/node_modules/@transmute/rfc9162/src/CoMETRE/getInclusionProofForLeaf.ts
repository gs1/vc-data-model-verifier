import { highestPowerOf2LessThanN } from '../RFC9162/highestPowerOf2LessThanN'
import { getRootFromLeaves } from './getRootFromLeaves'

export type CoMETREInclusionProof = {
  log_id: string
  tree_size: number
  leaf_index: number
  inclusion_path: Uint8Array[]
}

const PATH = async (m: number, D_n: Uint8Array[]): Promise<Uint8Array[]> => {
  const n = D_n.length
  if (n === 1 && m === 0) {
    return []
  }
  const k = highestPowerOf2LessThanN(n)
  if (m < k) {
    const first = await PATH(m, D_n.slice(0, k)) // PATH(m, D[0:k])
    const second = await getRootFromLeaves(D_n.slice(k, n)) // MTH(D[k:n])
    return first.concat(second)
  }
  // m >= k
  const first = await PATH(m - k, D_n.slice(k, n)) // PATH(m - k, D[k:n])
  const second = await getRootFromLeaves(D_n.slice(0, k)) // MTH(D[0:k])
  return first.concat(second)
}

export const getInclusionProofForLeaf = async (
  leaf_index: number,
  leaves: Uint8Array[],
): Promise<CoMETREInclusionProof> => {
  if (leaf_index < 0 || leaf_index > leaves.length) {
    throw new Error('Entry is not included in log.')
  }
  return {
    log_id: '',
    tree_size: leaves.length,
    leaf_index: leaf_index,
    inclusion_path: await PATH(leaf_index, leaves),
  }
}
