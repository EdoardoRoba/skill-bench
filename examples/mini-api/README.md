# mini-api (skillgen fixture)

A small Express API used as the fixture repo for skillgen's own examples and
eval scenarios. It is not a real product — it exists to give
`/skillgen:generate` and `/skillgen:eval` something realistic, but small, to
analyze and run scenarios against.

## Layout

```
src/
├── index.js           # app entrypoint, mounts routers
├── routes/            # API layer — one router per resource
│   ├── users.js
│   └── health.js
├── middleware/         # cross-cutting concerns (auth)
│   └── auth.js
└── db/                 # data layer — in-memory repositories
    └── userRepository.js
tests/                  # mirrors src/ layout, one *.test.js per module
├── routes/users.test.js
└── middleware/auth.test.js
```

## Conventions (intentional, for the generator to pick up on)

- Routes live under `src/routes/`, one file per resource, mounted in
  `src/index.js`.
- Data access is isolated in `src/db/*Repository.js` — routes never touch
  storage directly.
- Auth is a single reusable middleware (`requireAuth`) applied per-route,
  not globally.
- Every module under `src/` has a matching test file under `tests/` with
  the same relative path, suffixed `.test.js`.
- CommonJS (`require`/`module.exports`) throughout — no ESM.

## Running it

```bash
npm install
npm test
npm start
```
