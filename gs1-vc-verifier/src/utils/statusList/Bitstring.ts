export interface BitstringOptions {
  buffer?: Uint8Array;
  length?: number;
  leftToRightIndexing?: boolean;
  }
  
  export class Bitstring {
  private buffer: Uint8Array;
  private length: number;
  private leftToRightIndexing: boolean;
  
  /**
  * W3C Bitstring Status List v1.0 minimum size requirement: 16KB = 131,072 bits
  */
  public static readonly W3C_MINIMUM_SIZE_BITS = 131072;
  
  constructor({
  buffer,
  length,
  leftToRightIndexing = true,
  }: BitstringOptions) {
  if (buffer && length) {
  throw new Error('Only one of "buffer" or "length" must be provided');
  }
  
  if (buffer) {
  this.buffer = new Uint8Array(buffer);
  this.length = buffer.length * 8;
  } else if (length) {
  if (length <= 0) {
  throw new Error("Length must be positive");
  }
  this.length = length;
  this.buffer = new Uint8Array(Math.ceil(length / 8));
  // W3C specification requires bits to be initialized to 0 (false) by default
  // Uint8Array is already zero-initialized
  } else {
  throw new Error("Either buffer or length must be provided");
  }
  
  this.leftToRightIndexing = leftToRightIndexing;
  }
  
  /**
  * Creates a W3C compliant BitString for status lists with minimum size requirement.
  * Ensures the bitstring meets the W3C minimum size of 131,072 bits (16KB).
  */
  static createStatusListBitstring(requestedSize: number): Bitstring {
  const actualSize = Math.max(requestedSize, Bitstring.W3C_MINIMUM_SIZE_BITS);
  return new Bitstring({ length: actualSize, leftToRightIndexing: true });
  }
  
  /**
  * Validates that this BitString meets W3C requirements for status lists.
  */
  validateStatusListCompliance(): void {
  if (this.length < Bitstring.W3C_MINIMUM_SIZE_BITS) {
  throw new Error(
  `BitString size (${this.length} bits) does not meet W3C minimum requirement of ${Bitstring.W3C_MINIMUM_SIZE_BITS} bits (16KB)`
  );
  }
  }
  
  /**
  * Gets the length of the bitstring in bits
  */
  getLength(): number {
  return this.length;
  }
  
  /**
  * Gets the underlying buffer
  */
  getBuffer(): Uint8Array {
  return new Uint8Array(this.buffer);
  }
  
  /**
  * Checks if this bitstring uses left-to-right indexing
  */
  isLeftToRightIndexing(): boolean {
  return this.leftToRightIndexing;
  }
  
  set(position: number, value: boolean): void {
  if (position < 0) {
  throw new Error("Position must be non-negative");
  }
  if (position >= this.length) {
  throw new Error(
  `Position "${position}" is out of range "0-${this.length - 1}"`
  );
  }
  
  const { index, bit } = this.parsePosition(position);
  
  if (value) {
  this.buffer[index] |= bit;
  } else {
  this.buffer[index] &= 0xff ^ bit;
  }
  }
  
  get(position: number): boolean {
  if (position < 0) {
  throw new Error("Position must be non-negative");
  }
  if (position >= this.length) {
  throw new Error(
  `Position "${position}" is out of range "0-${this.length - 1}"`
  );
  }
  
  const { index, bit } = this.parsePosition(position);
  return (this.buffer[index] & bit) !== 0;
  }
  
  /**
  * Parses a bit position into byte index and bit mask.
  * Handles both left-to-right and right-to-left indexing.
  */
  private parsePosition(position: number): { index: number; bit: number } {
  const index = Math.floor(position / 8);
  const rem = position % 8;
  const shift = this.leftToRightIndexing ? 7 - rem : rem;
  const bit = 1 << shift;
  return { index, bit };
  }
  
  static async decodeBits({
  encoded,
  }: {
  encoded: string;
  }): Promise<Uint8Array> {
  if (!encoded || typeof encoded !== "string") {
  throw new Error("Encoded string cannot be null or empty");
  }
  
  try {
  // Handle base64url format (add padding if needed)
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
  base64 += "=".repeat(4 - padding);
  }
  
  const decoded = Buffer.from(base64, "base64");
  
  // Check if it's gzip compressed (starts with 0x1f8b)
  if (decoded.length >= 2 && decoded[0] === 0x1f && decoded[1] === 0x8b) {
  const zlib = await import("zlib");
  const decompressed = zlib.gunzipSync(decoded);
  return new Uint8Array(decompressed);
  }
  
  return new Uint8Array(decoded);
  } catch (error) {
  throw new Error(
  `Failed to decode bits: ${
  error instanceof Error ? error.message : "Unknown error"
  }`
  );
  }
  }
  
  async encodeBits(): Promise<string> {
  try {
  const zlib = await import("zlib");
  const compressed = zlib.gzipSync(Buffer.from(this.buffer));
  // Use base64url encoding without padding as per W3C spec
  return compressed
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=/g, "");
  } catch (error) {
  throw new Error(
  `Failed to encode bits: ${
  error instanceof Error ? error.message : "Unknown error"
  }`
  );
  }
  }
  }