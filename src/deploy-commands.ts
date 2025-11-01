import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const commands = [];
const commandsPath = join(__dirname, 'commands');
const files = readdirSync(commandsPath).filter(
	(f) => f.endsWith('.ts') || f.endsWith('.js'),
);

for (const file of files) {
	const filePath = join(commandsPath, file);
	const command = await import(pathToFileURL(filePath).href);

	if (command.default?.data) {
		commands.push(command.default.data.toJSON());
	}
}

const rest = new REST().setToken(token);

try {
	await rest.put(Routes.applicationCommands(clientId), {
		body: commands,
	});
	console.log('명령어 등록 성공');
} catch (err) {
	console.log(err);
}
