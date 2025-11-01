import { REST, Routes } from 'discord.js';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const rest = new REST().setToken(token);

rest
	.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log('명령어 전체 삭제 완료'))
	.catch(console.error);
