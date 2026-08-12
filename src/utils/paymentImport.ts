// Spreadsheet -> receipts pipeline. Pure functions only: no Firestore, no React, so the
// exact same code can be exercised from a node script against the real sheet.
//
// The rules encoded here were chosen against "nohami.xlsx" (4,767 rows, 1,184 members)
// after measuring how often each case actually occurs:
//
//   1. Byte-identical duplicate rows are collapsed silently (317 rows in that file).
//   2. A range that is off by exactly one slot is repaired by TRUSTING THE START and
//      moving the end ($200 over 130-140 becomes 130-139) — 171 rows.
//   3. If a member's rows contradict each other (the same payment number claimed twice),
//      that member is skipped ENTIRELY — none of their rows import, including clean ones.
//   4. The Id number is the only identity that matters. Names in the sheet are never
//      written to Firestore and never used for matching.

import {
  MemberReceipt,
  ReceiptIssue,
  normalizePayments,
  normalizeReceipts,
  normalizeDate,
  parseAmount,
  paymentNumbersFromRange,
  makeReceiptId,
} from './payments';

/** Dues price per payment number. Verified constant across every era of the sheet. */
export const SLOT_PRICE = 20;

/** Largest plausible range; anything wider is a typo, not a 100-month payment. */
const MAX_SLOTS = 60;

export type RowStatus =
  | 'ready'
  | 'duplicate-row'
  | 'invalid'
  | 'member-not-found'
  | 'blocked-member'
  | 'already-imported';

export interface ParsedRow {
  /** 1-based row number as it appears in the spreadsheet, header included. */
  sheetRow: number;
  memberId: string;
  sheetName: string;
  amount: number;
  rawDate: string;
  date: string;
  method: string;
  methodDetail: string;
  receiptNumber: string;
  rawReason: string;
  paymentNumbers: string[];
  remark: string;
  /** True when rule 2 moved the end of the range. */
  repairedRange: boolean;
  originalRange: string;
  status: RowStatus;
  issues: ReceiptIssue[];
}

export interface ImportSummary {
  totalRows: number;
  duplicateRows: number;
  invalidRows: number;
  memberNotFound: number;
  alreadyImported: number;
  blockedRows: number;
  blockedMembers: number;
  readyRows: number;
  readyMembers: number;
  paymentEntries: number;
  totalDollars: number;
  repairedRanges: number;
}

const HEADER_ALIASES: Record<keyof ColumnMap, string[]> = {
  memberId: ['idnumber', 'id', 'memberid'],
  firstName: ['firstname'],
  lastName: ['lastname'],
  amount: ['paymentamount', 'amount'],
  date: ['paymentdate', 'date'],
  method: ['paymentmethod', 'method'],
  receiptNumber: ['reciptnumber', 'receiptnumber', 'recipt', 'receipt'],
  reason: ['paymentreson', 'paymentreason', 'reason', 'reson'],
  remark: ['remark'],
};

export interface ColumnMap {
  memberId: string | null;
  firstName: string | null;
  lastName: string | null;
  amount: string | null;
  date: string | null;
  method: string | null;
  receiptNumber: string | null;
  reason: string | null;
  remark: string | null;
}

/**
 * Maps sheet headers onto known fields. Headers in these files carry stray spaces and
 * misspellings ("Adress", " payment amount ", "recipt number "), so matching is done on a
 * squashed lowercase form rather than exact text.
 */
export function detectColumns(headers: string[]): ColumnMap {
  const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const map = {} as ColumnMap;
  (Object.keys(HEADER_ALIASES) as (keyof ColumnMap)[]).forEach((field) => {
    const found = headers.find((h) => {
      const sq = squash(h);
      return HEADER_ALIASES[field].some((alias) => sq === alias || sq.includes(alias));
    });
    map[field] = found || null;
  });
  return map;
}

export function missingRequiredColumns(map: ColumnMap): string[] {
  const required: (keyof ColumnMap)[] = ['memberId', 'amount', 'date', 'receiptNumber', 'reason'];
  return required.filter((f) => !map[f]);
}

/**
 * Splits "check/4795" into a method and whatever was jammed in after it — usually a check
 * number or the name of the person who collected the cash. 861 rows in the sample file
 * carry such a detail, and it is worth keeping rather than discarding.
 */
export function splitMethod(raw: string): { method: string; methodDetail: string } {
  const text = String(raw || '').trim();
  if (!text) return { method: '', methodDetail: '' };
  const [head, ...rest] = text.split(/[/\\]/);
  const base = head.trim().toLowerCase();
  const detail = rest.join('/').replace(/^[\s/]+|[\s/]+$/g, '');

  const known = ['cash', 'check', 'zelle', 'bank', 'paypal'];
  const match = known.find((k) => base.startsWith(k));
  return { method: match || base, methodDetail: detail };
}

/** Parses "121-125", "111", "121 - 125". Returns null when it is not a range at all. */
function parseRange(raw: string): { from: number; to: number } | null {
  const s = String(raw || '').replace(/\s+/g, '');
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return { from: n, to: n };
  }
  const m = s.match(/^(\d+)-(\d+)$/);
  if (!m) return null;
  const from = Number(m[1]);
  const to = Number(m[2]);
  if (to < from || to - from + 1 > MAX_SLOTS) return null;
  return { from, to };
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const err = (code: ReceiptIssue['code'], message: string): ReceiptIssue => ({ level: 'error', code, message });
const warn = (code: ReceiptIssue['code'], message: string): ReceiptIssue => ({ level: 'warning', code, message });

/**
 * Stage 1: sheet rows -> ParsedRow[], applying dedupe (rule 1), range repair (rule 2) and
 * row-level validation. Knows nothing about Firestore.
 *
 * `rows` are objects keyed by header, as produced by XLSX.utils.sheet_to_json.
 */
export function parseSheet(rows: Record<string, any>[], columns: ColumnMap): ParsedRow[] {
  const seen = new Set<string>();
  const value = (row: Record<string, any>, key: string | null) =>
    key ? String(row[key] ?? '').trim() : '';

  return rows.map((row, index) => {
    const memberId = value(row, columns.memberId);
    const rawAmount = value(row, columns.amount);
    const rawDate = value(row, columns.date);
    const rawMethod = value(row, columns.method);
    const receiptNumber = value(row, columns.receiptNumber);
    const rawReason = value(row, columns.reason);
    const remark = value(row, columns.remark);
    const sheetName = `${value(row, columns.firstName)} ${value(row, columns.lastName)}`.replace(/\s+/g, ' ').trim();

    const { method, methodDetail } = splitMethod(rawMethod);
    const amount = parseAmount(rawAmount);
    const date = normalizeDate(rawDate);
    const range = parseRange(rawReason);

    const parsed: ParsedRow = {
      sheetRow: index + 2, // +1 for zero-index, +1 for the header row
      memberId,
      sheetName,
      amount,
      rawDate,
      date,
      method,
      methodDetail,
      receiptNumber,
      rawReason,
      paymentNumbers: [],
      remark,
      repairedRange: false,
      originalRange: rawReason,
      status: 'ready',
      issues: [],
    };

    // Rule 1: an exact repeat of a previous row is a data-entry artefact, not a payment.
    const fingerprint = [memberId, receiptNumber, rawAmount, rawDate, rawMethod, rawReason].join('~');
    if (seen.has(fingerprint)) {
      parsed.status = 'duplicate-row';
      return parsed;
    }
    seen.add(fingerprint);

    if (!memberId) parsed.issues.push(err('MEMBER_NOT_FOUND', 'No Id number on this row.'));
    if (!isFinite(amount) || amount <= 0) {
      parsed.issues.push(err('INVALID_AMOUNT', `Amount "${rawAmount}" is not a number.`));
    }
    if (!date) {
      parsed.issues.push(err('INVALID_DATE', `Date "${rawDate}" could not be read.`));
    } else if (date > todayIso() || date < '2000-01-01') {
      // Real typos in the source: "11/3/35" reads as 2035. A payment cannot be dated in
      // the future, and these records do not predate 2000.
      parsed.issues.push(err('INVALID_DATE', `Date "${rawDate}" resolves to ${date}, which is impossible.`));
    }
    if (!receiptNumber) parsed.issues.push(warn('MISSING_RECEIPT_NUMBER', 'No receipt number.'));

    if (!range) {
      parsed.issues.push(err('INVALID_RANGE', `Payment reason "${rawReason}" is not a payment range.`));
    } else {
      let { from, to } = range;

      // Rule 2: off by exactly one slot -> trust the start, move the end.
      if (isFinite(amount) && amount > 0) {
        const expectedSlots = amount / SLOT_PRICE;
        const actualSlots = to - from + 1;
        if (Number.isInteger(expectedSlots) && Math.abs(actualSlots - expectedSlots) === 1) {
          to = from + expectedSlots - 1;
          parsed.repairedRange = true;
          parsed.issues.push(
            warn('AMOUNT_MISMATCH', `Range ${rawReason} corrected to ${from}-${to} to match $${amount}.`)
          );
        }
      }

      parsed.paymentNumbers = paymentNumbersFromRange(from, to);

      if (isFinite(amount) && amount > 0) {
        const slots = parsed.paymentNumbers.length;
        if (Math.abs(amount - slots * SLOT_PRICE) > 0.009) {
          parsed.issues.push(
            err('AMOUNT_MISMATCH', `$${amount} does not equal ${slots} x $${SLOT_PRICE}.`)
          );
        }
      }
    }

    if (parsed.issues.some((i) => i.level === 'error')) parsed.status = 'invalid';
    return parsed;
  });
}

export interface MemberLookup {
  /** Member documents keyed by BOTH document id and newId, so either can match. */
  byKey: Map<string, Record<string, any>>;
}

/**
 * Builds the lookup used to match sheet rows to members.
 *
 * The Id number column has never been confirmed to be the document id rather than the
 * `newId` field, so both are indexed and the preview reports which one actually matched.
 * Document id wins on collision.
 */
export function buildMemberLookup(members: Record<string, any>[]): MemberLookup {
  const byKey = new Map<string, Record<string, any>>();
  members.forEach((m) => {
    if (m.newId != null && String(m.newId).trim()) {
      byKey.set(String(m.newId).trim(), m);
    }
  });
  members.forEach((m) => {
    if (m.id != null) byKey.set(String(m.id).trim(), m);
  });
  return { byKey };
}

/**
 * Stage 2: resolve each row against the members already in Firestore, then apply rule 3.
 *
 * Mutates and returns the same ParsedRow objects. Rows already written by a previous run
 * (same receipt id on the member) are marked 'already-imported' and, importantly, are NOT
 * treated as contradictions — that is what makes re-running the same file safe.
 */
export function resolveAgainstMembers(rows: ParsedRow[], lookup: MemberLookup): ParsedRow[] {
  const candidates = rows.filter((r) => r.status === 'ready');

  // Match members, and drop anything already imported.
  candidates.forEach((row) => {
    const member = lookup.byKey.get(row.memberId);
    if (!member) {
      row.status = 'member-not-found';
      row.issues.push(err('MEMBER_NOT_FOUND', `No member with Id ${row.memberId}.`));
      return;
    }
    const receiptId = makeReceiptId(row.date, row.receiptNumber);
    const existing = normalizeReceipts(member.receipts);
    if (existing.some((r) => r.receiptId === receiptId)) {
      row.status = 'already-imported';
    }
  });

  // Rule 3: a member whose remaining rows contradict each other — or contradict payments
  // already in Firestore — is skipped in full.
  const byMember = new Map<string, ParsedRow[]>();
  rows
    .filter((r) => r.status === 'ready')
    .forEach((r) => {
      if (!byMember.has(r.memberId)) byMember.set(r.memberId, []);
      byMember.get(r.memberId)!.push(r);
    });

  byMember.forEach((memberRows, memberId) => {
    const member = lookup.byKey.get(memberId);
    const claimed = new Map<string, string>(); // payment number -> what claimed it
    let conflict = '';

    normalizePayments(member?.payments).forEach((p) => {
      claimed.set(String(p.paymentNumber), 'already in the system');
    });

    // Two rows sharing a receipt id (same date AND same receipt number) would collapse
    // into one write, silently dropping the second. Same ambiguity as a contested payment
    // number — a duplicate or an uncorrected correction — so it blocks the member too.
    const receiptIds = new Map<string, ParsedRow>();
    memberRows.forEach((row) => {
      const rid = makeReceiptId(row.date, row.receiptNumber);
      const prior = receiptIds.get(rid);
      if (prior && !conflict) {
        conflict =
          `Receipt ${row.receiptNumber} on ${row.date} appears twice with different details ` +
          `(rows ${prior.sheetRow} and ${row.sheetRow}).`;
      }
      if (!prior) receiptIds.set(rid, row);
    });

    memberRows.forEach((row) => {
      row.paymentNumbers.forEach((n) => {
        const prior = claimed.get(n);
        if (prior && !conflict) {
          conflict = `Payment ${n} is claimed twice: ${prior} and receipt ${row.receiptNumber} (row ${row.sheetRow}).`;
        }
        if (!prior) claimed.set(n, `receipt ${row.receiptNumber} (row ${row.sheetRow})`);
      });
    });

    if (conflict) {
      memberRows.forEach((row) => {
        row.status = 'blocked-member';
        row.issues.push(err('RANGE_COLLISION', conflict));
      });
    }
  });

  return rows;
}

export function summarize(rows: ParsedRow[]): ImportSummary {
  const ready = rows.filter((r) => r.status === 'ready');
  const blocked = rows.filter((r) => r.status === 'blocked-member');
  return {
    totalRows: rows.length,
    duplicateRows: rows.filter((r) => r.status === 'duplicate-row').length,
    invalidRows: rows.filter((r) => r.status === 'invalid').length,
    memberNotFound: rows.filter((r) => r.status === 'member-not-found').length,
    alreadyImported: rows.filter((r) => r.status === 'already-imported').length,
    blockedRows: blocked.length,
    blockedMembers: new Set(blocked.map((r) => r.memberId)).size,
    readyRows: ready.length,
    readyMembers: new Set(ready.map((r) => r.memberId)).size,
    paymentEntries: ready.reduce((sum, r) => sum + r.paymentNumbers.length, 0),
    totalDollars: ready.reduce((sum, r) => sum + r.amount, 0),
    repairedRanges: ready.filter((r) => r.repairedRange).length,
  };
}

/** Groups the importable rows by member so each member is written in one transaction. */
export function groupForWrite(rows: ParsedRow[]): Map<string, ParsedRow[]> {
  const grouped = new Map<string, ParsedRow[]>();
  rows
    .filter((r) => r.status === 'ready')
    .forEach((r) => {
      if (!grouped.has(r.memberId)) grouped.set(r.memberId, []);
      grouped.get(r.memberId)!.push(r);
    });
  return grouped;
}

export function rowToReceipt(row: ParsedRow, createdBy?: string): Omit<MemberReceipt, 'createdAt'> {
  const sorted = [...row.paymentNumbers].sort((a, b) => Number(a) - Number(b));
  const receipt: Omit<MemberReceipt, 'createdAt'> = {
    receiptId: makeReceiptId(row.date, row.receiptNumber),
    receiptNumber: row.receiptNumber,
    totalAmount: row.amount,
    date: row.date,
    method: row.method,
    coversFrom: sorted[0],
    coversTo: sorted[sorted.length - 1],
  };
  if (row.methodDetail) (receipt as any).methodDetail = row.methodDetail;
  if (row.remark) (receipt as any).remark = row.remark;
  if (createdBy) receipt.createdBy = createdBy;
  return receipt;
}

const STATUS_LABEL: Record<RowStatus, string> = {
  ready: 'Ready',
  'duplicate-row': 'Duplicate row (identical to an earlier row)',
  invalid: 'Invalid',
  'member-not-found': 'Member not found',
  'blocked-member': 'Blocked: member has contradictory rows',
  'already-imported': 'Already imported',
};

export function statusLabel(status: RowStatus): string {
  return STATUS_LABEL[status];
}

/** CSV of everything that did not import, for fixing in the spreadsheet and re-running. */
export function problemRowsCsv(rows: ParsedRow[]): string {
  const problems = rows.filter((r) => r.status !== 'ready' && r.status !== 'already-imported');
  const header = [
    'Sheet Row', 'Status', 'Id number', 'Name', 'Amount', 'Date', 'Method', 'Receipt Number', 'Payment Reason', 'Problem',
  ];
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = problems.map((r) =>
    [
      r.sheetRow,
      statusLabel(r.status),
      r.memberId,
      r.sheetName,
      isFinite(r.amount) ? r.amount : '',
      r.rawDate,
      r.method + (r.methodDetail ? `/${r.methodDetail}` : ''),
      r.receiptNumber,
      r.originalRange,
      r.issues.map((i) => i.message).join(' '),
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
