// Bundlers replace `process.env.NODE_ENV` with a string literal; this
// package reads nothing else from `process` and runs in browsers, so it
// declares only that instead of depending on Node's types.
declare const process: { env: { NODE_ENV?: string } };
