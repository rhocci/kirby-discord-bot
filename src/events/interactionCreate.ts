import { Events, type Interaction } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	once: false,
	execute,
};

async function execute(interaction: Interaction) {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.log(`${interaction.commandName} 명령어 없음`);
		await interaction.reply({
			content:
				'유효하지 않은 명령어입니다.\n`/?` 를 입력해 명령어 목록을 확인하세요.',
			ephemeral: true,
		});
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
}
