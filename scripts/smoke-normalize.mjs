import { normalizeText } from '../functions/_shared/normalize.js';

const { normalized, administrationTimes } = normalizeText('Take Amoxicillin 500mg bd po prn');

const checks = [
  normalized.toLowerCase().includes('twice daily'),
  normalized.toLowerCase().includes('by mouth'),
  normalized.toLowerCase().includes('as needed'),
  administrationTimes.includes('as needed'),
];

if (!checks.every(Boolean)) {
  console.error('normalize smoke failed', { normalized, administrationTimes });
  process.exit(1);
}

console.log('normalize smoke ok');
