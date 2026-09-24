// Runs a TS script with the app's "@/..." alias; `server-only` is a no-op here.
import { createJiti } from 'jiti';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jiti = createJiti(import.meta.url, {
  alias: { '@': root, 'server-only': path.join(root, 'scripts/noop.cjs') },
});
await jiti.import(path.resolve(process.argv[2]));
