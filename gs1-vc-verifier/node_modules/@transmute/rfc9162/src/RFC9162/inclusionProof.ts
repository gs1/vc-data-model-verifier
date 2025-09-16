import { EQUAL } from './EQUAL'
import { PATH } from './PATH'


export type InclusionProofDataV2 = {
  log_id: string
  tree_size: number
  leaf_index: number
  inclusion_path: Uint8Array[]
}

export const inclusionProof = async (entry: Uint8Array, entries: Uint8Array[]): Promise<InclusionProofDataV2> => {
  const m = entries.findIndex((value) => {
    return EQUAL(value, entry)
  })
  if (m === -1) {
    throw new Error('Entry is not included in log.')
  }
  return {
    log_id: '',
    tree_size: entries.length,
    leaf_index: m,
    inclusion_path: await PATH(m, entries),
  }
}
