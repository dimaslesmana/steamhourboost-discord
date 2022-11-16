module.exports = () => {
  const datetime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  // Format to YYYY-MM-DD HH:mm:ss timezone
  return datetime.replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+) (.+)/, '$3-$1-$2 $4:$5:$6 $7');
};
