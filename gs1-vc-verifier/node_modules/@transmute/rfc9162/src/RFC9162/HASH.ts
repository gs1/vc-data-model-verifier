// @ts-ignore
const nodeCrypto = import('crypto').catch(() => { }) as any

export const HASH = async (content: Uint8Array): Promise<Uint8Array> => {
  try {
    const digest = await window.crypto.subtle.digest('SHA-256', content);
    return new Uint8Array(digest)
  } catch (e) {
    const digest = await (await nodeCrypto).createHash('sha256').update(content).digest();
    return new Uint8Array(digest)
  }
}