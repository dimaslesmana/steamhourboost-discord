const env = require('./load-env');

const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = env.CRYPTO_SECRET();
const iv = randomBytes(16);

function encrypt(text) {
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
}

function decrypt(hash) {
  const decipher = createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

  return decrpyted.toString();
}

module.exports = { encrypt, decrypt };