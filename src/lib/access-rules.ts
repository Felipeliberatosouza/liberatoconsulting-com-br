export type PricingMode = 'free' | 'paid' | 'referral';
export function toolAccess(mode: string, paid: boolean, referred: boolean) {
  return mode === 'free' || (mode === 'paid' && paid) || (mode === 'referral' && referred);
}
export function referralAvailable(r: { state: string; used_at: string | null; expires_at: string }, now: number) {
  return r.state === 'accepted' && !r.used_at && Date.parse(r.expires_at) > now;
}
export function signingCodeValid(expires: string | null, attempts: number, now: number) {
  return !!expires && Date.parse(expires) > now && attempts < 5;
}
export function signingComplete(signers: Array<{ signed_at: string | null }>) {
  return signers.length === 4 && signers.every(s => !!s.signed_at);
}
