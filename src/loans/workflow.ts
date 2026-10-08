import { LoanStatus, Role } from '@prisma/client';

/** Allowed status moves and the roles that may perform each one. */
const TRANSITIONS: Record<LoanStatus, Partial<Record<LoanStatus, Role[]>>> = {
  SUBMITTED: { UNDER_REVIEW: ['ANALYST', 'ADMIN'] },
  UNDER_REVIEW: { APPROVED: ['ANALYST', 'ADMIN'], REJECTED: ['ANALYST', 'ADMIN'] },
  APPROVED: { DISBURSED: ['ADMIN'] },
  REJECTED: {},
  DISBURSED: {},
};

export function canTransition(from: LoanStatus, to: LoanStatus, role: Role): boolean {
  return TRANSITIONS[from]?.[to]?.includes(role) ?? false;
}

export function nextStatuses(from: LoanStatus, role: Role): LoanStatus[] {
  return (Object.entries(TRANSITIONS[from] ?? {}) as [LoanStatus, Role[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([status]) => status);
}
