import { getRootFromLeaves } from './getRootFromLeaves'
import { getLeafFromEntry } from './getLeafFromEntry'
import {
  getInclusionProofForLeaf,
  CoMETREInclusionProof,
} from './getInclusionProofForLeaf'

import { getRootFromInclusionProof } from './getRootFromInclusionProof'

import {
  getConsistencyProofFromLeaves,
  CoMETREConsistencyProof,
} from './getConsistencyProofFromLeaves'
import { verifyConsistencyProof } from './verifyConsistencyProof'

const leaves = (entries: Uint8Array[]) => {
  return entries.map(getLeafFromEntry)
}

const root = (leaves: Uint8Array[]) => {
  return getRootFromLeaves(leaves)
}

const iproof = (leaf_index: number, leaves: Uint8Array[]) => {
  return getInclusionProofForLeaf(leaf_index, leaves)
}

const viproof = (leaf: Uint8Array, proof: CoMETREInclusionProof) => {
  return getRootFromInclusionProof(leaf, proof)
}

const cproof = (proof: CoMETREInclusionProof, leaves: Uint8Array[]) => {
  return getConsistencyProofFromLeaves(proof, leaves)
}

const vcproof = (
  first_root: Uint8Array,
  second_root: Uint8Array,
  proof: CoMETREConsistencyProof,
) => {
  return verifyConsistencyProof(
    first_root,
    proof.tree_size_1,
    second_root,
    proof.tree_size_2,
    proof,
  )
}

const tree_alg = 'RFC9162_SHA256'

export const RFC9162_SHA256 = {
  tree_alg,
  root,
  leaf: getLeafFromEntry,
  inclusion_proof: iproof,
  verify_inclusion_proof: viproof,
  consistency_proof: cproof,
  verify_consistency_proof: vcproof,
}

export default RFC9162_SHA256
