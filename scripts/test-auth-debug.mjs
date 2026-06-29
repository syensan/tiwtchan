// Direct test of the auth lib
const { verifyPassword, getExpectedPassword } = await import('/home/z/my-project/src/lib/auth.ts');
const expected = getExpectedPassword();
console.log('Expected password:', JSON.stringify(expected));
console.log('Length:', expected.length);
const input = 'tw-7xQ9!kz-Lm2-vR4$pW8-@nE6-cB3^yU-0&hA5-qZx9#mK';
console.log('Input:    ', JSON.stringify(input));
console.log('Length:', input.length);
console.log('Match:', verifyPassword(input));
console.log('Env S1:', JSON.stringify(process.env.ADMIN_PW_S1));
console.log('Env S2:', JSON.stringify(process.env.ADMIN_PW_S2));
