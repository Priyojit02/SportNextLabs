import { copyFile } from 'fs/promises';
import path from 'path';

const src = path.join(process.cwd(), 'dist', 'index.html');
const dest = path.join(process.cwd(), 'dist', '200.html');

async function main() {
  try {
    await copyFile(src, dest);
    console.log('Created dist/200.html');
  } catch (err) {
    // If dist/index.html doesn't exist (build failed earlier), don't fail the whole process here.
    console.warn('Could not create dist/200.html:', err.message || err);
    process.exit(0);
  }
}

main();
