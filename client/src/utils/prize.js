const WINNING_SETS = [
  { numbers: [1, 2, 3, 4, 5, 6], prize: 10000 },
  { numbers: [7, 14, 21, 28, 35, 42], prize: 100 },
  { numbers: [3, 12, 23, 31, 38, 45], prize: 5 },
];

function sameNumbers(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].map(Number).sort((x, y) => x - y);
  const sb = [...b].map(Number).sort((x, y) => x - y);
  return sa.every((n, i) => n === sb[i]);
}

export function evaluateTicket(numbers, purchaseDate) {
  const purchased = new Date(purchaseDate);
  const now = new Date();
  const ageDays = (now - purchased) / (1000 * 60 * 60 * 24);

  if (Number.isFinite(ageDays) && ageDays > 90) {
    return { status: 'expired', prizeAmount: 0 };
  }

  for (const set of WINNING_SETS) {
    if (sameNumbers(numbers, set.numbers)) {
      return { status: 'winner', prizeAmount: set.prize };
    }
  }

  return { status: 'active', prizeAmount: 0 };
}
