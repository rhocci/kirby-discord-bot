import { Client, Collection, Events, IntentsBitField } from 'discord.js';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const token = process.env.DISCORD_TOKEN;
const intents = new IntentsBitField().add(
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.MessageContent,
	IntentsBitField.Flags.GuildVoiceStates,
);

const client = new Client({ intents }) as Client & {
	commands: Collection<string, any>;
};
client.commands = new Collection();

const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter((file) =>
		file.endsWith('.ts'),
	);

	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = await import(filePath);

		if ('data' in command.default && 'execute' in command.default) {
			client.commands.set(command.default.data.name, command.default);
		} else {
			console.log(`${filePath}의 커맨드에 필요한 데이터나 메서드가 없습니다.`);
		}
	}
}

client.once(Events.ClientReady, (readyClient) => {
	console.log(`봇 준비 완료! ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (err) {
		console.error(err);
		const message = { content: '오류 발생', ephemeral: true };

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(message);
		} else {
			await interaction.reply(message);
		}
	}
});

client.login(token);
