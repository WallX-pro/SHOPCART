// utils/escapeRegex.js
// Escapes special RegExp metacharacters from user-supplied strings before we
// embed them in a dynamic regex. Without this, a query like "a+" would compile
// to a regex that means "one or more 'a'" instead of the literal string "a+",
// opening ReDoS (Regex Denial-of-Service) and unexpected match behaviour.

const escapeRegex = (str) => {
  // Replace every character that has special meaning in RegExp with an escaped version.
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = escapeRegex;
