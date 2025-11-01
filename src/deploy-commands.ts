import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const commands = [];
const foldersPath = join(__dirname, 'commands');
const folders = readdirSync(foldersPath);

for (const folder of folders) {
	const commandsPath = join(foldersPath, folder);
	const files = readdirSync(commandsPath).filter((f) => f.endsWith('.ts'));

	for (const file of files) {
		const command = await import(join(commandsPath, file));
		commands.push(command.default.data.toJSON());
	}

	const rest = new REST().setToken(token);

	(async () => {
		try {
			await rest.put(Routes.applicationCommands(clientId), {
				body: commands,
			});
			console.log('명령어 등록 성공');
		} catch (err) {
			console.log(err);
		}
	})();
}
