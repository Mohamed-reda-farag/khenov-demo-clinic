import type { Conflict } from '@/lib/scheduling/conflicts';

export interface ValidationIssue {
  field: string;
  reason: 'required' | 'invalid' | 'duplicate' | 'too_long' | 'range';
}

export type RepositoryErrorCode =
  | 'conflict'
  | 'not_found'
  | 'invalid_transition'
  | 'validation'
  /** Deleting or changing something that upcoming appointments depend on. */
  | 'in_use'
  /** Booking with a doctor who is switched off. */
  | 'inactive'
  /** Booking or moving an appointment to a time that has already passed. */
  | 'past_time'
  /** Moving or editing an appointment that is Done, Cancelled or No-show. */
  | 'locked_status'
  /** Asking for data the logged-in role is not allowed to see. */
  | 'forbidden';

/** Every failure a repository can report. The UI switches on `code`. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly conflicts: Conflict[];
  readonly issues: ValidationIssue[];
  /** Number of upcoming appointments blocking the change (`in_use`). */
  readonly count: number;

  constructor(
    code: RepositoryErrorCode,
    details: { conflicts?: Conflict[]; issues?: ValidationIssue[]; count?: number } = {},
  ) {
    super(code);
    this.name = 'RepositoryError';
    this.code = code;
    this.conflicts = details.conflicts ?? [];
    this.issues = details.issues ?? [];
    this.count = details.count ?? 0;
  }
}

export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError;
}
