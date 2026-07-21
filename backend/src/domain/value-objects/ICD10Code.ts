const ICD10_PATTERN = /^[A-Z]\d{2}(\.\d{1,2})?$/;

export class ICD10Code {
  private constructor(readonly value: string) {}

  static create(code: string): ICD10Code {
    const normalized = code.trim().toUpperCase();
    if (!ICD10_PATTERN.test(normalized)) {
      throw new Error(`Invalid ICD-10 code format: ${code}`);
    }
    return new ICD10Code(normalized);
  }

  static unsafe(code: string): ICD10Code {
    return new ICD10Code(code);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ICD10Code): boolean {
    return this.value === other.value;
  }
}
