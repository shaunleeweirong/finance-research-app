import 'server-only';
import { createHash } from 'node:crypto';

// 8-char SHA-256 prefix gives ~32 bits of correlation space — enough to
// connect log lines for the same user/customer within a debugging session
// while preventing logs (Vercel function logs, forwarded sinks, screenshots
// pasted into tickets) from being a slow-leak deanonymization corpus of
// real Stripe customer IDs and Supabase user UUIDs.
//
// Use for any ID that identifies a person or paying account. Keep event IDs,
// invoice IDs, and request IDs unhashed — they're useful for cross-referencing
// with the Stripe Dashboard or Vercel observability and don't identify a user.
export function hashId(id: string | null | undefined): string {
  if (!id) return '<empty>';
  return createHash('sha256').update(id).digest('hex').slice(0, 8);
}
