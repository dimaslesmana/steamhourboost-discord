const switchFn = (lookupObject, defaultCase = '_default') =>
  (expression) => (lookupObject[expression] || lookupObject[defaultCase])();

module.exports = switchFn;
