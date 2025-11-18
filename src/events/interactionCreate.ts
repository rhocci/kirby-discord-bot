import type { ButtonInteraction, Embed, Interaction } from 'discord.js';
import {
	ActionRowBuilder,
	Collection,
	EmbedBuilder,
	Events,
	MessageFlags,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import dayjs from 'dayjs';
import { approvalRows } from '@/components/excusion.js';
import { colors } from '@/styles/palette.js';
import supabase from '@/supabase/index.js';

export default {
	name: Events.InteractionCreate,
	once: false,
	execute,
};

const DEFAULT_COOLDOWN = 3;

async function execute(interaction: Interaction) {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.log(`${interaction.commandName} 명령어 없음`);
			return interaction.reply({
				content: '유효하지 않은 명령어입니다.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const { cooldowns } = interaction.client;
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const inputTime = interaction.createdTimestamp;
		const timestamps = cooldowns.get(command.data.name);
		const cooldownAmount = (command.cooldown ?? DEFAULT_COOLDOWN) * 1000;

		if (timestamps.has(interaction.user.id)) {
			const expirationTime =
				timestamps.get(interaction.user.id) + cooldownAmount;

			if (inputTime < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1000);
				await interaction.reply({
					content: `요청이 많습니다.\n${expiredTimestamp}초 뒤에 다시 시도해주세요.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			timestamps.set(interaction.user.id, inputTime);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
		}

		await command.execute(interaction);
	}

	if (interaction.isButton()) {
		if (interaction.customId === 'excusion_apply')
			return applyExcusion(interaction);
		if (interaction.customId === 'excusion_approve') {
			if (
				!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)
			) {
				return interaction.reply({
					content: '⚠️ 관리자 권한이 필요합니다.',
					flags: MessageFlags.Ephemeral,
				});
			}
			return approveExcusion(interaction);
		}
		if (interaction.customId === 'excusion_reject') {
			if (
				!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)
			) {
				return interaction.reply({
					content: '⚠️ 관리자 권한이 필요합니다.',
					flags: MessageFlags.Ephemeral,
				});
			}
			return rejectExcusion(interaction);
		}
	}

	if (interaction.isModalSubmit()) {
		if (interaction.customId === 'excusion_modal') {
			const reason = interaction.fields.getTextInputValue('excusion_reason');

			await interaction.reply({
				content: `공결 신청 완료!\n관리자의 승인을 기다려 주세요.`,
				flags: MessageFlags.Ephemeral,
			});

			const excusionEmbed = new EmbedBuilder()
				.setTitle('승인 대기중')
				.addFields({ name: '신청자', value: `${interaction.user}` })
				.setColor(colors.neon.yellow)
				.setTimestamp();

			if (interaction.channel && 'send' in interaction.channel) {
				await interaction.channel.send({
					content: '<@&1438132990969647157> <@&1433327466834952312>',
					embeds: [excusionEmbed],
					components: [approvalRows],
				});
			}

			try {
				const admin = await interaction.channel?.client.users.fetch(
					'1361880083366940834',
				);
				const date = dayjs().tz('Asia/Seoul').format('YYYY월 MM월 DD일');

				await admin?.send({
					embeds: [
						new EmbedBuilder()
							.setTitle('✅ 공결 신청 알림')
							.setDescription('승인 대기중인 신청이 있습니다.')
							.addFields(
								{
									name: '날짜',
									value: `${date}`,
								},
								{
									name: '신청자',
									value: `${interaction.user}`,
								},
								{
									name: '사유',
									value: `${reason}`,
								},
							)
							.setURL(
								`https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message?.id}`,
							)
							.setColor(colors.neon.pink),
					],
				});
			} catch (err) {
				console.error(`관리자 DM 전송 실패: ${err}`);
			}
		}
		if (interaction.customId === 'reject_modal') {
			if (
				!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)
			) {
				return interaction.reply({
					content: '⚠️ 관리자 권한이 필요합니다.',
					flags: MessageFlags.Ephemeral,
				});
			}

			const reason = interaction.fields.getTextInputValue('reject_reason');

			const originalMessage = interaction.message;
			const originalEmbed = originalMessage?.embeds[0] as Embed;
			const updatedEmbed = EmbedBuilder.from(originalEmbed!)
				.setTitle('❌ 공결신청 반려됨')
				.setDescription(`반려 사유: ${reason}`)
				.setColor(colors.neon.red);

			await interaction.reply({
				content: '반려 처리 완료',
				flags: MessageFlags.Ephemeral,
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
		.setPlaceholder('사유는 관리자에게만 보여집니다.')
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
	const applicantId = originalEmbed?.fields
		.find((f) => f.name === '신청자')
		?.value?.match(/\d+/)?.[0];

	await interaction.update({
		embeds: [updatedEmbed],
		components: [],
	});

	if (!applicantId) {
		return console.error('신청자 ID 찾기 실패');
	}

	const { data: member, error: memberError } = await supabase
		.from('members')
		.select('id')
		.eq('discord_id', applicantId)
		.single();

	if (memberError) {
		return console.error('유효하지 않은 구성원');
	}

	const { error: updateError } = await supabase
		.from('attendance_log')
		.update({
			status: 'excused',
		})
		.eq('member_id', member.id)
		.eq(
			'date',
			dayjs(interaction.createdAt).tz('Asia/Seoul').format('YYYY-MM-DD'),
		);

	if (updateError) {
		return console.error(`출석 DB 업데이트 실패: ${updateError.message}`);
	}

	console.log('출석 DB 업데이트 성공');
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
