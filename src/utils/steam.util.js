const appIdsToBytes = (appIds) => {
  // Create a Buffer with enough space to store all of the app ids
  const buffer = Buffer.alloc(appIds.length * 4);

  // Write each app id to the Buffer as a 32-bit signed integer
  for (let i = 0; i < appIds.length; i++) {
    buffer.writeInt32BE(appIds[i], i * 4);
  }

  return buffer;
};

const bytesToAppIds = (buffer) => {
  // Convert the Buffer to an array of 32-bit signed integers
  const appIds = [];

  for (let i = 0; i < buffer.length; i += 4) {
    const appId = buffer.readInt32BE(i);

    appIds.push(appId);
  }

  return appIds;
};

module.exports = {
  appIdsToBytes,
  bytesToAppIds,
};
