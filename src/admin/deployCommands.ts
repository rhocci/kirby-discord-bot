import { REST, Routes } from 'discord.js';
import * as attendanceCommands from '@/commands/attendance.js';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const commands = Object.values(attendanceCommands.default).map((cmd) =>
	cmd.data.toJSON(),
);

const rest = new REST().setToken(token);

try {
	await rest.put(Routes.applicationCommands(clientId), {
		body: commands,
	});
	console.log('명령어 등록 성공');
} catch (err) {
	console.log(err);
}
