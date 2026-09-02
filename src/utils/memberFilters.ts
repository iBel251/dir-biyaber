// Search ranking and payment-number filtering for the members/payments lists.
// Pure functions: no store, no React, so the rules can be reasoned about on their own.

import { normalizePayments, parsePaymentNumberList } from './payments';

export type PaymentFilterMode =
  | 'off'
  /** Paid every one of the selected numbers. */
  | 'paid-all'
  /** Paid at least one of them. */
  | 'paid-any'
  /** Paid none of them — the "who still owes" list. */
  | 'unpaid-all'
  /** Missing at least one of them. */
  | 'unpaid-any';

export interface MemberFilters {
  query: string;
  paymentInput: string;
  mode: PaymentFilterMode;
}

export const EMPTY_FILTERS: MemberFilters = { query: '', paymentInput: '', mode: 'off' };

export const PAYMENT_MODE_LABELS: Record<PaymentFilterMode, string> = {
  off: 'No payment filter',
  'paid-all': 'Paid ALL of these',
  'paid-any': 'Paid ANY of these',
  'unpaid-all': 'Paid NONE of these',
  'unpaid-any': 'Missing AT LEAST ONE of these',
};

/** The set of payment numbers a member has actually paid. */
export function paidNumbersOf(member: Record<string, any>): Set<string> {
  return new Set(normalizePayments(member?.payments).map((p) => String(p.paymentNumber)));
}

/**
 * Match rank, lowest first. Exact ID beats everything: searching "909" must surface member
 * 909 above the members who merely have 909 somewhere in a phone number.
 * Returns null when the member does not match at all.
 */
export function matchRank(member: Record<string, any>, query: string): number | null {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const id = String(member.id ?? '').toLowerCase();
  const newId = String(member.newId ?? '').toLowerCase();
  const name = String(member.fullName ?? '').toLowerCase();
  const nameAm = String(member.fullNameAm ?? '').toLowerCase();
  const phone = String(member.phone ?? '').toLowerCase();
  const email = String(member.email ?? '').toLowerCase();

  if (id === q || newId === q) return 0;
  if (id.startsWith(q) || newId.startsWith(q)) return 1;
  if (id.includes(q) || newId.includes(q)) return 2;

  // Name matches that begin a word rank above matches buried mid-string.
  const startsWord = (text: string) => text.split(/\s+/).some((word) => word.startsWith(q));
  if (startsWord(name) || startsWord(nameAm)) return 3;
  if (name.includes(q) || nameAm.includes(q)) return 4;

  if (phone.includes(q) || email.includes(q)) return 5;
  return null;
}

function passesPaymentFilter(
  member: Record<string, any>,
  numbers: string[],
  mode: PaymentFilterMode
): boolean {
  if (mode === 'off' || numbers.length === 0) return true;
  const paid = paidNumbersOf(member);
  const paidCount = numbers.filter((n) => paid.has(n)).length;

  switch (mode) {
    case 'paid-all':
      return paidCount === numbers.length;
    case 'paid-any':
      return paidCount > 0;
    case 'unpaid-all':
      return paidCount === 0;
    case 'unpaid-any':
      return paidCount < numbers.length;
    default:
      return true;
  }
}

/**
 * Applies the payment filter, then the text search, returning matches ordered by rank.
 * Ties keep their original order, so an unsearched list stays in whatever order it arrived.
 */
export function filterAndRankMembers(
  members: Record<string, any>[],
  filters: MemberFilters
): Record<string, any>[] {
  const numbers = parsePaymentNumberList(filters.paymentInput);
  const ranked: Array<{ member: Record<string, any>; rank: number; index: number }> = [];

  members.forEach((member, index) => {
    if (!passesPaymentFilter(member, numbers, filters.mode)) return;
    const rank = matchRank(member, filters.query);
    if (rank === null) return;
    ranked.push({ member, rank, index });
  });

  ranked.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index));
  return ranked.map((r) => r.member);
}

/**
 * The export table as rows, header first. CSV and Excel are the same data in two
 * containers, so the shape is built once here and serialised by the callers.
 */
export function membersToRows(members: Record<string, any>[], numbers: string[]): any[][] {
  const header = ['ID', 'Full Name', 'Full Name (Am)', 'Phone', 'Email', 'Status'];
  if (numbers.length) header.push(...numbers.map((n) => `Payment ${n}`), 'Missing');

  const rows = members.map((m) => {
    const row: any[] = [m.id, m.fullName, m.fullNameAm, m.phone, m.email, m.status];
    if (numbers.length) {
      const paid = paidNumbersOf(m);
      numbers.forEach((n) => row.push(paid.has(n) ? 'paid' : ''));
      row.push(numbers.filter((n) => !paid.has(n)).join(' '));
    }
    return row;
  });

  return [header, ...rows];
}

/** CSV of a filtered result, for chasing unpaid dues away from the screen. */
export function membersToCsv(members: Record<string, any>[], numbers: string[]): string {
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return membersToRows(members, numbers)
    .map((row) => row.map(escape).join(','))
    .join('\n');
}
