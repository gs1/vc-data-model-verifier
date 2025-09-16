import { HASH } from '../RFC9162/HASH'
import { CONCAT } from '../RFC9162/CONCAT'
import { hexToBin } from '../RFC9162/hexToBin'
import { strToBin } from '../RFC9162/strToBin'
import { highestPowerOf2LessThanN } from '../RFC9162/highestPowerOf2LessThanN'
import { CUT } from '../RFC9162/CUT'
const EMPTY_STRING = strToBin('')

export const getRootFromLeaves = async (leaves: Uint8Array[]): Promise<Uint8Array> => {
  const n = leaves.length
  if (n === 0) {
    return HASH(EMPTY_STRING)
  }
  if (n === 1) {
    return leaves[0]
  }
  const k = highestPowerOf2LessThanN(n)
  const left = CUT(leaves, 0, k)
  const right = CUT(leaves, k, n)
  const prefix = hexToBin('01')
  return HASH(
    CONCAT(prefix, CONCAT(await getRootFromLeaves(left), await getRootFromLeaves(right))),
  )
}
