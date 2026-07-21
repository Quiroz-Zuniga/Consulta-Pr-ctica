export class PasscodeHash {
  private constructor(readonly value: string) {}

  static create(hash: string): PasscodeHash {
    if (!hash || hash.length < 16) {
      throw new Error('Invalid passcode hash');
    }
    return new PasscodeHash(hash);
  }

  static unsafe(hash: string): PasscodeHash {
    return new PasscodeHash(hash);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PasscodeHash): boolean {
    return this.value === other.value;
  }
}
