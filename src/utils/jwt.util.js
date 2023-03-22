const tokenToBytes = (token) => {
  return Buffer.from(token);
};

const bytesToToken = (buffer) => {
  return buffer.toString();
};

const decodeJwtPayload = (token) => {
  const payload = token.split('.')[1];
  const decoded = Buffer.from(payload, 'base64');
  const parsed = JSON.parse(decoded.toString());

  return parsed;
};

const isTokenExpired = (token) => {
  const { exp } = decodeJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);

  return now > exp;
};

module.exports = {
  tokenToBytes,
  bytesToToken,
  decodeJwtPayload,
  isTokenExpired,
};
