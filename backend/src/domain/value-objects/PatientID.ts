const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PatientID {
  private constructor(readonly value: string) {}

  static create(id: string): PatientID {
    if (!UUID_PATTERN.test(id)) {
      throw new Error(`Invalid patient ID format: ${id}`);
    }
    return new PatientID(id);
  }

  static unsafe(id: string): PatientID {
    return new PatientID(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PatientID): boolean {
    return this.value === other.value;
  }
}
