// M2 insights = categorization + recurring detection + anomaly flags, composed over a
// normalized dataset. Pure: same dataset in, same insights out. This sits alongside
// the M1 advisor (advisor.js answers the money questions; insights explain the flow).

import { categorySummary } from './categorize.js';
import { detectRecurring } from './recurring.js';
import { detectAnomalies } from './anomaly.js';

export function insights(dataset) {
  const txns = dataset.txns;
  return {
    categories: categorySummary(txns),
    recurring: detectRecurring(txns),
    anomalies: detectAnomalies(txns)
  };
}
