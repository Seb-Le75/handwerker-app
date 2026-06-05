/* eslint-disable @typescript-eslint/no-require-imports */
// javascript src/utils/customer_number.js
// Einfache, dateibasierte Kundennummer mit führenden Nullen (KD-0001)
const fs = require('fs');
const path = require('path');

// Pfad zur Zählerdatei (relativ zum Projektroot: data/customer_counter.txt)
const COUNTER_PATH = path.join(__dirname, '..', '..', 'data', 'customer_counter.txt');
const WIDTH = 4; // Anzahl Stellen, z. B. 4 -> KD-0001

function readCounter() {
  if (!fs.existsSync(COUNTER_PATH)) return 0;
  const txt = fs.readFileSync(COUNTER_PATH, 'utf8').trim();
  return txt === '' ? 0 : parseInt(txt, 10);
}

function writeCounter(n) {
  fs.mkdirSync(path.dirname(COUNTER_PATH), { recursive: true });
  fs.writeFileSync(COUNTER_PATH, String(n), 'utf8');
}

function getNextCustomerNumber() {
  const n = readCounter() + 1;
  writeCounter(n);
  return `KD-${String(n).padStart(WIDTH, '0')}`;
}

module.exports = { getNextCustomerNumber };
