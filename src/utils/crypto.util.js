const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const environments = require('../environments');

const key = environments.CRYPTO_SECRET_KEY;

const ALGORITHM = {
  BLOCK_CIPHER: 'aes-256-gcm',
  AUTH_TAG_BYTE_LEN: 16,
  IV_BYTE_LEN: 12,
  KEY_BYTE_LEN: 32,
  SALT_BYTE_LEN: 16,
};

function encrypt(messageText) {
  if (!messageText) {
    return '';
  }

  const iv = randomBytes(ALGORITHM.IV_BYTE_LEN);
  const cipher = createCipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, {
    'authTagLength': ALGORITHM.AUTH_TAG_BYTE_LEN,
  });

  let cipherBuffer = Buffer.concat([cipher.update(messageText), cipher.final()]);
  cipherBuffer = Buffer.concat([iv, cipherBuffer, cipher.getAuthTag()]);

  const ivHex = cipherBuffer.slice(0, ALGORITHM.IV_BYTE_LEN).toString('hex');
  const encryptedMessage = cipherBuffer.slice(ALGORITHM.IV_BYTE_LEN, -ALGORITHM.AUTH_TAG_BYTE_LEN).toString('hex');
  const authTag = cipherBuffer.slice(-ALGORITHM.AUTH_TAG_BYTE_LEN).toString('hex');

  iv.fill(0);
  cipherBuffer.fill(0);

  return ivHex + encryptedMessage + authTag;
}

function decrypt(cipherText) {
  if (!cipherText) {
    return '';
  }

  const iv = Buffer.from(cipherText.slice(0, ALGORITHM.IV_BYTE_LEN * 2), 'hex');
  const encryptedMessage = Buffer.from(cipherText.slice(ALGORITHM.IV_BYTE_LEN * 2, -ALGORITHM.AUTH_TAG_BYTE_LEN * 2), 'hex');
  const authTag = Buffer.from(cipherText.slice(-ALGORITHM.AUTH_TAG_BYTE_LEN * 2), 'hex');
  const decipher = createDecipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, {
    'authTagLength': ALGORITHM.AUTH_TAG_BYTE_LEN,
  });

  decipher.setAuthTag(authTag);
  const decryptedMessage = Buffer.concat([decipher.update(encryptedMessage), decipher.final()]);
  const messageText = decryptedMessage.toString('utf-8');

  iv.fill(0);
  encryptedMessage.fill(0);
  decryptedMessage.fill(0);
  authTag.fill(0);

  return messageText;
}

module.exports = { encrypt, decrypt };
