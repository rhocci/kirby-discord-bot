import { Client, Collection, IntentsBitField } from 'discord.js';
import 'dotenv/config';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const token = process.env.DISCORD_TOKEN;
const intents = new IntentsBitField().add(
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.MessageContent,
	IntentsBitField.Flags.GuildVoiceStates,
);
const client = new Client({ intents });

// 커맨드 로드
client.commands = new Collection();
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(
	(f) => f.endsWith('.ts') || f.endsWith('.js'),
);

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const command = await import(pathToFileURL(filePath).href);

	if (command.default?.data) {
		client.commands.set(command.default.data.name, command.default);
	}
}

// 이벤트 로드
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(
	(f) => f.endsWith('.ts') || f.endsWith('.js'),
);

for (const file of eventFiles) {
	const filePath = join(eventsPath, file);
	const event = await import(pathToFileURL(filePath).href);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);
