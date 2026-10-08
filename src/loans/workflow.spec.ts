import { canTransition, nextStatuses } from './workflow';

describe('loan workflow', () => {
  it('lets an analyst pick up and decide a submitted loan', () => {
    expect(canTransition('SUBMITTED', 'UNDER_REVIEW', 'ANALYST')).toBe(true);
    expect(canTransition('UNDER_REVIEW', 'APPROVED', 'ANALYST')).toBe(true);
    expect(canTransition('UNDER_REVIEW', 'REJECTED', 'ANALYST')).toBe(true);
  });

  it('blocks applicants from changing status', () => {
    expect(canTransition('SUBMITTED', 'UNDER_REVIEW', 'APPLICANT')).toBe(false);
  });

  it('only lets an admin disburse', () => {
    expect(canTransition('APPROVED', 'DISBURSED', 'ANALYST')).toBe(false);
    expect(canTransition('APPROVED', 'DISBURSED', 'ADMIN')).toBe(true);
  });

  it('does not allow skipping review', () => {
    expect(canTransition('SUBMITTED', 'APPROVED', 'ADMIN')).toBe(false);
  });

  it('treats rejected and disbursed as final', () => {
    expect(nextStatuses('REJECTED', 'ADMIN')).toEqual([]);
    expect(nextStatuses('DISBURSED', 'ADMIN')).toEqual([]);
  });
});
