import { REST, Routes } from 'discord.js';
import { checkinCommand, checkoutCommand } from '@/commands/attendance.js';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const commands = [checkinCommand.data.toJSON(), checkoutCommand.data.toJSON()];

const rest = new REST().setToken(token);

try {
	await rest.put(Routes.applicationCommands(clientId), {
		body: commands,
	});
	console.log('명령어 등록 성공');
} catch (err) {
	console.log(err);
}
