# Friendsim Conventions

## Runtime / dev server
- Vite dev server must be started with a Procway port-registry allocated `PORT`; do not rely on the package fallback port except outside Procway.

## Simulation logic
- Keep MBTI definitions, situation definitions, persistence helpers, relationship labels, and event generation in `src/simulation.js` so behavior can be unit-tested without rendering the React UI.
- When changing relationship behavior, update `src/simulation.test.js` with deterministic tests for MBTI axes, situation text, relationship delta, and 0-100 clamping.

## Persistence
- Browser state is stored in `localStorage` under `friendsim-state-v1`; invalid or incompatible data should fall back safely to initial data.
