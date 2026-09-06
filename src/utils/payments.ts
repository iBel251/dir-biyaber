// Shared payment/receipt shapes and pure helpers.
//
// Everything here is side-effect free so the CSV importer can validate a whole sheet
// against already-loaded member documents without touching Firestore.
//
// Data model note: `member.payments` is unchanged from the original design — one entry
// per payment NUMBER (a dues slot). `member.receipts` is the new parallel array holding
// the real-world transaction (one check, one receipt number, one optional photo). Payment
// entries created from a receipt carry its `receiptId`; entries written before receipts
// existed have no `receiptId` and are still perfectly valid.

export interface MemberReceipt {
  receiptId: string;
  receiptNumber: string;
  totalAmount: number;
  /** Always YYYY-MM-DD. The legacy `paidAt` on payment entries is not this well behaved. */
  date: string;
  method: string;
  place?: string;
  /** Inclusive payment-number range this receipt paid for, e.g. 121 -> 125. */
  coversFrom: string;
  coversTo: string;
  imageUrl?: string;
  /** Storage path, kept so the image can be deleted without parsing the download URL. */
  imagePath?: string;
  /**
   * What imageUrl points at. Photos uploaded with a receipt are images; the bulk scan
   * library is PDFs, which cannot be rendered in an <img>. Absent on everything written
   * before the scan-linking page existed, so readers must treat "missing" as 'image'.
   */
  fileType?: 'pdf' | 'image';
  createdAt: string;
  createdBy?: string;
  /** Set by the (not yet run) backfill so synthesised receipts stay distinguishable. */
  backfilled?: boolean;
}

export interface PaymentEntry {
  paymentNumber: string;
  data: Record<string, any>;
}

/**
 * Payment entries have been stored both as an array and as a keyed object over the life of
 * this project, and the readers each re-implemented the same normalisation. One copy.
 */
export function normalizePayments(payments: any): PaymentEntry[] {
  if (Array.isArray(payments)) {
    return payments.filter((p) => p && p.paymentNumber != null);
  }
  if (payments && typeof payments === 'object') {
    return Object.entries(payments).map(([paymentNumber, data]) => ({
      paymentNumber,
      data: (data ?? {}) as Record<string, any>,
    }));
  }
  return [];
}

export function normalizeReceipts(receipts: any): MemberReceipt[] {
  return Array.isArray(receipts) ? receipts.filter(Boolean) : [];
}

/** Inclusive list of payment numbers as strings: (121, 125) -> ['121','122','123','124','125'] */
export function paymentNumbersFromRange(from: number | string, to: number | string): string[] {
  const start = Number(from);
  const end = Number(to);
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return [];
  const out: string[] = [];
  for (let n = start; n <= end; n++) out.push(String(n));
  return out;
}

/**
 * Parses a human-written list of payment numbers into a de-duplicated sorted list.
 * Accepts ranges and single numbers in any mix: "121-130, 135  140" -> 121..130, 135, 140.
 * Junk is ignored rather than rejected, so a half-typed filter never throws.
 */
export function parsePaymentNumberList(input: string): string[] {
  const out = new Set<string>();
  String(input || '')
    .split(/[,;\s]+/)
    .filter(Boolean)
    .forEach((token) => {
      const range = token.match(/^(\d+)-(\d+)$/);
      if (range) {
        paymentNumbersFromRange(range[1], range[2]).forEach((n) => out.add(n));
      } else if (/^\d+$/.test(token)) {
        out.add(String(Number(token)));
      }
    });
  const list: string[] = [];
  out.forEach((n) => list.push(n));
  return list.sort((a, b) => Number(a) - Number(b));
}

/** How many dues slots a total covers at a given per-slot price. */
export function slotCount(totalAmount: number | string, singleAmount: number | string): number {
  const total = Number(totalAmount);
  const single = Number(singleAmount);
  if (!isFinite(total) || !isFinite(single) || single <= 0) return 0;
  return Math.floor(total / single);
}

/**
 * Accepts what a spreadsheet is likely to contain (11/1/2025, 2025-11-01, an Excel serial
 * already converted to a Date) and returns YYYY-MM-DD, or '' if it cannot be read.
 * Deliberately treats a bare M/D/YYYY as US order, matching the source sheets.
 */
export function normalizeDate(input: any): string {
  if (!input) return '';
  if (input instanceof Date && !isNaN(input.getTime())) {
    return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, '0')}-${String(input.getDate()).padStart(2, '0')}`;
  }
  const raw = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Strip a time component off an ISO string rather than re-parsing it into another zone.
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) return isoMatch[1];
  // M/D/YYYY and M/D/YY. The payment sheets are overwhelmingly two-digit years
  // (5/21/26), and a two-digit year is read as 20xx — these records only run from the
  // 2000s, so there is no 1900s case to disambiguate.
  const usMatch = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    const month = Number(m);
    const day = Number(d);
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return '';
}

/** Money as a plain number, tolerating '$100.00' and '1,200'. NaN if unreadable. */
export function parseAmount(input: any): number {
  if (typeof input === 'number') return input;
  if (input == null) return NaN;
  const cleaned = String(input).replace(/[$,\s]/g, '');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

/**
 * Receipt ids are derived from date + receipt number so re-importing the same sheet row
 * produces the same id, which makes a duplicate import detectable rather than silently
 * doubling. The random suffix only appears when the receipt number is missing.
 */
export function makeReceiptId(date: string, receiptNumber: string): string {
  const safeNumber = String(receiptNumber || '').replace(/[^A-Za-z0-9_-]/g, '');
  const safeDate = (date || 'nodate').replace(/[^0-9-]/g, '');
  if (!safeNumber) return `r_${safeDate}_${Math.random().toString(36).slice(2, 8)}`;
  return `r_${safeDate}_${safeNumber}`;
}

export type IssueLevel = 'error' | 'warning';

export interface ReceiptIssue {
  level: IssueLevel;
  code:
    | 'MEMBER_NOT_FOUND'
    | 'MEMBER_INACTIVE'
    | 'INVALID_RANGE'
    | 'INVALID_DATE'
    | 'INVALID_AMOUNT'
    | 'MISSING_RECEIPT_NUMBER'
    | 'DUPLICATE_RECEIPT_NUMBER'
    | 'RANGE_COLLISION'
    | 'AMOUNT_MISMATCH';
  message: string;
}

export interface ReceiptDraft {
  receiptNumber: string;
  totalAmount: number;
  singleAmount: number;
  date: string;
  method: string;
  place?: string;
  paymentNumbers: string[];
}

/**
 * Validates a draft receipt against a member document. `member` may be null to report a
 * failed ID match, which is what the importer needs for unmatched rows.
 *
 * Errors block the write; warnings are shown in the preview but can be accepted.
 */
export function validateReceiptDraft(draft: ReceiptDraft, member: Record<string, any> | null): ReceiptIssue[] {
  const issues: ReceiptIssue[] = [];

  if (!member) {
    issues.push({ level: 'error', code: 'MEMBER_NOT_FOUND', message: 'No member with this ID.' });
    return issues;
  }

  if (!draft.paymentNumbers.length) {
    issues.push({ level: 'error', code: 'INVALID_RANGE', message: 'Payment range is empty or invalid.' });
  }
  if (!draft.date) {
    issues.push({ level: 'error', code: 'INVALID_DATE', message: 'Payment date is missing or unreadable.' });
  }
  if (!isFinite(draft.totalAmount) || draft.totalAmount <= 0) {
    issues.push({ level: 'error', code: 'INVALID_AMOUNT', message: 'Payment amount is missing or unreadable.' });
  }
  if (!String(draft.receiptNumber || '').trim()) {
    issues.push({ level: 'warning', code: 'MISSING_RECEIPT_NUMBER', message: 'No receipt number on this row.' });
  }

  const receipts = normalizeReceipts(member.receipts);
  if (
    draft.receiptNumber &&
    receipts.some((r) => String(r.receiptNumber) === String(draft.receiptNumber))
  ) {
    issues.push({
      level: 'error',
      code: 'DUPLICATE_RECEIPT_NUMBER',
      message: `Receipt ${draft.receiptNumber} is already recorded for this member.`,
    });
  }

  const existing = new Set(normalizePayments(member.payments).map((p) => String(p.paymentNumber)));
  const collisions = draft.paymentNumbers.filter((n) => existing.has(n));
  if (collisions.length) {
    issues.push({
      level: 'error',
      code: 'RANGE_COLLISION',
      message: `Already paid: ${collisions.join(', ')}.`,
    });
  }

  // The sheet states a total and a range independently, so they can disagree.
  if (
    isFinite(draft.totalAmount) &&
    draft.singleAmount > 0 &&
    draft.paymentNumbers.length > 0 &&
    Math.abs(draft.totalAmount - draft.singleAmount * draft.paymentNumbers.length) > 0.009
  ) {
    issues.push({
      level: 'warning',
      code: 'AMOUNT_MISMATCH',
      message: `${draft.totalAmount} does not equal ${draft.paymentNumbers.length} x ${draft.singleAmount}.`,
    });
  }

  if (member.status && String(member.status).toLowerCase() !== 'active') {
    issues.push({ level: 'warning', code: 'MEMBER_INACTIVE', message: `Member status is "${member.status}".` });
  }

  return issues;
}

export function hasBlockingIssue(issues: ReceiptIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
