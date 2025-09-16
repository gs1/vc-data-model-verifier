import { HASH } from '../RFC9162/HASH'
import { CONCAT } from '../RFC9162/CONCAT'
import { hexToBin } from '../RFC9162/hexToBin'

export const getLeafFromEntry = async (entry: Uint8Array): Promise<Uint8Array> => {
  if (!entry) {
    throw new Error('getLeafFromEntry requires a Uint8Array entry.')
  }
  const prefix = hexToBin('00')
  return await HASH(CONCAT(prefix, entry))
}
