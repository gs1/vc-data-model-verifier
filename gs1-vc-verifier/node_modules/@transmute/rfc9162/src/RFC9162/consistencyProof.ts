import { PROOF } from './PROOF'

import { InclusionProofDataV2 } from './inclusionProof'

export type ConsistencyProofDataV2 = {
  log_id: string
  tree_size_1: number
  tree_size_2: number
  consistency_path: Uint8Array[]
}

export const consistencyProof = async (
  previousInclusionProof: InclusionProofDataV2,
  currentEntries: Uint8Array[],
): Promise<ConsistencyProofDataV2> => {
  const tree_size_1 = previousInclusionProof.tree_size
  const tree_size_2 = currentEntries.length
  const consistency_path = await PROOF(
    previousInclusionProof.tree_size,
    currentEntries,
  )
  return {
    log_id: '',
    tree_size_1,
    tree_size_2,
    consistency_path,
  }
}
