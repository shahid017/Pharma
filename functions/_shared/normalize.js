export const MEDICAL_ABBREVIATIONS = {
  bd: 'twice daily',
  'b.d.': 'twice daily',
  bid: 'twice daily',
  'b.i.d.': 'twice daily',
  od: 'once daily',
  'o.d.': 'once daily',
  qd: 'once daily',
  'q.d.': 'once daily',
  tid: 'three times daily',
  't.i.d.': 'three times daily',
  qid: 'four times daily',
  'q.i.d.': 'four times daily',
  hs: 'at bedtime',
  'h.s.': 'at bedtime',
  prn: 'as needed',
  'p.r.n.': 'as needed',
  ac: 'before meals',
  'a.c.': 'before meals',
  pc: 'after meals',
  'p.c.': 'after meals',
  qam: 'every morning',
  'q.a.m.': 'every morning',
  qpm: 'every evening',
  'q.p.m.': 'every evening',
  qhs: 'every night at bedtime',
  'q.h.s.': 'every night at bedtime',
  stat: 'immediately',
  po: 'by mouth',
  'p.o.': 'by mouth',
  im: 'intramuscular',
  'i.m.': 'intramuscular',
  iv: 'intravenous',
  'i.v.': 'intravenous',
  sc: 'subcutaneous',
  's.c.': 'subcutaneous',
  sl: 'sublingual',
  's.l.': 'sublingual',
  qw: 'once weekly',
  'q.w.': 'once weekly',
  qod: 'every other day',
  'q.o.d.': 'every other day',
};

export const TIME_PATTERNS = {
  morning: ['morning', 'a.m.', 'am', 'breakfast', 'qam'],
  afternoon: ['afternoon', 'noon', 'lunch'],
  evening: ['evening', 'p.m.', 'pm', 'dinner', 'qpm'],
  bedtime: ['bedtime', 'hs', 'h.s.', 'night', 'qhs', 'q.h.s.', 'before sleep'],
  'before meals': ['ac', 'a.c.', 'before meals', 'before eating', 'preprandial'],
  'after meals': ['pc', 'p.c.', 'after meals', 'after eating', 'postprandial'],
  'as needed': ['prn', 'p.r.n.', 'as needed', 'when necessary'],
};

export function normalizeText(text) {
  let normalized = text;
  const administrationTimes = [];
  const textLower = text.toLowerCase();

  for (const [abbr, fullForm] of Object.entries(MEDICAL_ABBREVIATIONS)) {
    const pattern = new RegExp(`\\b${abbr.replace(/\./g, '\\.')}\\b`, 'gi');
    normalized = normalized.replace(pattern, fullForm);
  }

  for (const [timeCategory, patterns] of Object.entries(TIME_PATTERNS)) {
    for (const pattern of patterns) {
      if (textLower.includes(pattern.toLowerCase())) {
        if (!administrationTimes.includes(timeCategory)) {
          administrationTimes.push(timeCategory);
        }
      }
    }
  }

  if (administrationTimes.length === 0) {
    administrationTimes.push('No specific time mentioned');
  }

  return { normalized, administrationTimes };
}
