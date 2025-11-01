import { Client, Collection, Events, IntentsBitField } from 'discord.js';
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

const client = new Client({ intents }) as Client & {
	commands: Collection<string, any>;
};
client.commands = new Collection();

const commandsPath = join(__dirname, 'commands');
const files = readdirSync(commandsPath).filter(
	(f) => f.endsWith('.ts') || f.endsWith('.js'),
);

for (const file of files) {
	const filePath = join(commandsPath, file);
	const command = await import(pathToFileURL(filePath).href);

	if (command.default?.data) {
		client.commands.set(command.default.data.name, command.default);
	}
}

client.once(Events.ClientReady, (readyClient) => {
	console.log(`봇 준비 완료! ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) {
		console.log(`${interaction.commandName} 명령어 없음`);

		return;
	}

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
