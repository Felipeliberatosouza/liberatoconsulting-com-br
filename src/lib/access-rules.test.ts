import { describe, expect, it } from 'vitest';
import { toolAccess, referralAvailable, signingCodeValid, signingComplete } from './access-rules';
describe('modalidades e indicação', () => {
 it('gratuita não exige compra ou indicação', () => expect(toolAccess('free', false, false)).toBe(true));
 it('paga exige pagamento mesmo com indicação', () => { expect(toolAccess('paid', false, true)).toBe(false); expect(toolAccess('paid', true, false)).toBe(true); });
 it('indicação exige envio aceito', () => { expect(toolAccess('referral', false, false)).toBe(false); expect(toolAccess('referral', false, true)).toBe(true); });
 it('amigo tem uma única abertura', () => { const r = {state:'accepted', used_at:null, expires_at:'2026-11-01'}; expect(referralAvailable(r, Date.parse('2026-10-25'))).toBe(true); expect(referralAvailable({...r,used_at:'2026-10-25'}, Date.parse('2026-10-25'))).toBe(false); });
 it('envio falho não libera visita', () => expect(referralAvailable({state:'failed', used_at:null, expires_at:'2026-11-01'}, Date.parse('2026-10-25'))).toBe(false));
});
describe('assinatura', () => {
 it('código expira e bloqueia após cinco tentativas', () => { expect(signingCodeValid('2026-10-25T10:10:00Z',4,Date.parse('2026-10-25T10:09:00Z'))).toBe(true); expect(signingCodeValid('2026-10-25T10:10:00Z',5,Date.parse('2026-10-25T10:09:00Z'))).toBe(false); expect(signingCodeValid('2026-10-25T10:10:00Z',0,Date.parse('2026-10-25T10:10:00Z'))).toBe(false); });
 it('conclui somente com as duas partes e duas testemunhas', () => { expect(signingComplete([{signed_at:'now'}])).toBe(false); expect(signingComplete(Array.from({length:4},()=>({signed_at:'now'})))).toBe(true); expect(signingComplete([{signed_at:null},...Array.from({length:3},()=>({signed_at:'now'}))])).toBe(false); });
});
