/* eslint-disable @typescript-eslint/no-require-imports */
// javascript src/create_customer_example.js
// Einfaches Beispiel: erzeugt einen "Kunden" und gibt die Kundennummer aus.
const { getNextCustomerNumber } = require('./utils/customer_number');

function createCustomer(name) {
  const customerNumber = getNextCustomerNumber();
  const customer = { number: customerNumber, name };
  console.log('Created customer:', customer);
  return customer;
}

if (require.main === module) {
  const name = process.argv[2] || 'Max Mustermann';
  createCustomer(name);
}
