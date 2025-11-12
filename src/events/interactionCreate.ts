import {
	ActionRowBuilder,
	ButtonInteraction,
	Collection,
	Embed,
	EmbedBuilder,
	Events,
	type Interaction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { approvalRows } from '@/commands/excusion.js';
import { colors } from '@/styles/palette.js';

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
			return applyExcusion(interaction);
		if (interaction.customId === 'excusion_approve')
			return approveExcusion(interaction);
		if (interaction.customId === 'excusion_reject')
			return rejectExcusion(interaction);
	}

	if (interaction.isModalSubmit()) {
		if (interaction.customId === 'excusion_modal') {
			const reason = interaction.fields.getTextInputValue('excusion_reason');

			await interaction.reply({
				content: `공결 신청 완료!\n관리자의 승인을 기다려 주세요.`,
				ephemeral: true,
			});

			const excusionEmbed = new EmbedBuilder()
				.setTitle('승인 대기중')
				.addFields(
					{ name: '신청자', value: `${interaction.user}` },
					{ name: '사유', value: reason },
				)
				.setColor(colors.neon.yellow)
				.setTimestamp();

			if (interaction.channel && 'send' in interaction.channel) {
				await interaction.channel.send({
					content: '<@1361880083366940834> <@&1433327466834952312>',
					embeds: [excusionEmbed],
					components: [approvalRows],
				});
			}
		}
		if (interaction.customId === 'reject_modal') {
			const reason = interaction.fields.getTextInputValue('reject_reason');

			const originalMessage = interaction.message;
			const originalEmbed = originalMessage?.embeds[0] as Embed;
			const updatedEmbed = EmbedBuilder.from(originalEmbed!)
				.setTitle('❌ 공결신청 반려됨')
				.setDescription(`반려 사유: ${reason}`)
				.setColor(colors.neon.red);

			await interaction.reply({
				content: '반려 처리 완료',
				ephemeral: true,
			});

			await originalMessage?.edit({
				embeds: [updatedEmbed],
				components: [],
			});
		}
	}
}

async function applyExcusion(interaction: ButtonInteraction) {
	const modal = new ModalBuilder()
		.setCustomId('excusion_modal')
		.setTitle('공결 신청하기');

	const reasonInput = new TextInputBuilder()
		.setCustomId('excusion_reason')
		.setLabel('신청 사유')
		.setStyle(TextInputStyle.Paragraph)
		.setPlaceholder('사유는 관리자에게만 보여지며 따로 저장되지 않습니다.')
		.setRequired(true)
		.setMaxLength(300);

	const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
		reasonInput,
	);

	modal.addComponents(modalRow);
	await interaction.showModal(modal);
}

async function approveExcusion(interaction: ButtonInteraction) {
	const originalEmbed = interaction.message.embeds[0] as Embed;
	const updatedEmbed = EmbedBuilder.from(originalEmbed)
		.setTitle('✅ 공결신청 승인됨')
		.setColor(colors.neon.green);

	await interaction.update({
		embeds: [updatedEmbed],
		components: [],
	});
}

async function rejectExcusion(interaction: ButtonInteraction) {
	const modal = new ModalBuilder()
		.setCustomId('reject_modal')
		.setTitle('공결 신청하기');

	const reasonInput = new TextInputBuilder()
		.setCustomId('reject_reason')
		.setLabel('반려 사유')
		.setStyle(TextInputStyle.Paragraph)
		.setPlaceholder('ex. 사유 불충분 등')
		.setRequired(true)
		.setMaxLength(50);

	const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
		reasonInput,
	);

	modal.addComponents(modalRow);
	await interaction.showModal(modal);
}
