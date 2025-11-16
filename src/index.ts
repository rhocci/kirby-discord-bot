import { Client, Collection, IntentsBitField } from 'discord.js';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import 'dotenv/config';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { startHealthServer } from '@/api/healthCheck.js';
import * as attendanceCommands from '@/commands/attendance.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

console.log('Dayjs 타임존 업데이트:', dayjs().format('YYYY-MM-DD HH:mm:ss Z'));

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

client.cooldowns = new Collection();
client.commands = new Collection();

const loaded = [
	attendanceCommands.checkinCommand,
	attendanceCommands.checkoutCommand,
].filter(Boolean);

for (const cmd of loaded) {
	client.commands.set(cmd.data.name, cmd);
	console.log(`명령어 로드: ${cmd.data.name}`);
}

// 이벤트 로드
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(
	(f) => f.endsWith('.ts') || f.endsWith('.js'),
);

for (const file of eventFiles) {
	const filePath = join(eventsPath, file);
	const event = await import(pathToFileURL(filePath).href);

	if (event.default?.once) {
		client.once(event.default.name, (...args) =>
			event.default.execute(...args),
		);
	} else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
}

startHealthServer();
client.login(token);
