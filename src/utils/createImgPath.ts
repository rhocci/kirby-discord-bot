import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createImgPath(file: string) {
	return {
		attach: path.join(__dirname, '../assets/images', file),
		url: `attachment://${file}`,
	};
}
