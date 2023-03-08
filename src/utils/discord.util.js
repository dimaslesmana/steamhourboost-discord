const splitDiscordMessage = (text, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) => {
  if (text.length <= maxLength) {
    return text;
  }

  const splitText = text.split(char);

  if (splitText.length === 1) {
    throw new RangeError('SPLIT_MAX_LEN');
  }

  const messages = [];

  let msg = '';

  for (const chunk of splitText) {
    if (msg && (msg + char + chunk + append).length > maxLength) {
      messages.push(msg + append);
      msg = prepend;
    }

    msg += (msg && msg !== prepend ? char : '') + chunk;
  }

  return messages.concat(msg).filter(m => m);
};

module.exports = {
  splitDiscordMessage,
};
