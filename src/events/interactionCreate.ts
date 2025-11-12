import { Collection, Events, type Interaction } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	once: false,
	execute,
};

async function execute(interaction: Interaction) {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);
		const { cooldowns } = interaction.client;

		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const defaultCooldown = 3;
		const cooldownAmount = (command.cooldown ?? defaultCooldown) * 1000;

		if (timestamps.has(interaction.user.id)) {
			const expirationTime =
				timestamps.get(interaction.user.id) + cooldownAmount;

			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1000);
				return interaction.reply({
					content: `요청이 많습니다.\n${expiredTimestamp}초 뒤에 다시 시도해주세요.`,
					ephemeral: true,
				});
			}

			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
		}

		if (!command) {
			console.log(`${interaction.commandName} 명령어 없음`);
			return interaction.reply({
				content:
					'유효하지 않은 명령어입니다.\n`/?` 를 입력해 명령어 목록을 확인하세요.',
				ephemeral: true,
			});
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

	if (interaction.isButton()) {
		if (interaction.customId === 'excusion_apply')
			await applyExcusion(interaction);
	}
}

async function applyExcusion(interaction: Interaction) {}
