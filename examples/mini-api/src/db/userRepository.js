const users = new Map([
  [1, { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' }],
  [2, { id: 2, name: 'Alan Turing', email: 'alan@example.com' }],
]);

let nextId = 3;

function findById(id) {
  return users.get(Number(id)) ?? null;
}

function list() {
  return Array.from(users.values());
}

function create({ name, email }) {
  const user = { id: nextId++, name, email };
  users.set(user.id, user);
  return user;
}

module.exports = { findById, list, create };
