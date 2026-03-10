import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env'), override: true });
