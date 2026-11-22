import type { TFunction } from 'i18next';
import type { ValidationIssue } from '@/data/repository/errors';

/** One readable sentence for a validation issue returned by a repository. */
export function issueText(t: TFunction, issue: ValidationIssue): string {
  if (issue.field === 'phone')
    return issue.reason === 'duplicate' ? t('form.phoneDuplicate') : t('form.phoneInvalid');
  if (issue.reason === 'too_long') return t('validation.tooLong');
  return t(`validation.${issue.field}`);
}

export function issueFor(
  issues: readonly ValidationIssue[],
  field: string,
): ValidationIssue | undefined {
  return issues.find((issue) => issue.field === field);
}
