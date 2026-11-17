import type { Conflict } from '@/lib/scheduling/conflicts';

export interface ValidationIssue {
  field: 'name' | 'phone';
  reason: 'required' | 'invalid' | 'duplicate';
}

export type RepositoryErrorCode = 'conflict' | 'not_found' | 'invalid_transition' | 'validation';

/** Every failure a repository can report. The UI switches on `code`. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly conflicts: Conflict[];
  readonly issues: ValidationIssue[];

  constructor(
    code: RepositoryErrorCode,
    details: { conflicts?: Conflict[]; issues?: ValidationIssue[] } = {},
  ) {
    super(code);
    this.name = 'RepositoryError';
    this.code = code;
    this.conflicts = details.conflicts ?? [];
    this.issues = details.issues ?? [];
  }
}

export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError;
}
