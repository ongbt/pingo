const crypto = require('crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
const jwks = JSON.stringify({
  keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: 'default' }]
});

console.log('--- JWT_PRIVATE_KEY ---');
console.log(privateKey);
console.log('\n--- JWKS ---');
console.log(jwks);
