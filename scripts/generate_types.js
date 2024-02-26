import { createBundle } from 'dts-buddy';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf-8'));

fs.writeFileSync(`${dir}/index.d.ts`, "import './types/index.js';\n");

await createBundle({
    output: `${dir}/types/index.d.ts`,
    modules: {
        [pkg.name]: `${dir}/src/public.d.ts`,
    }
});
