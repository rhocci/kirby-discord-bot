import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const applyButton = new ButtonBuilder()
	.setCustomId('excusion_apply')
	.setLabel('신청하기')
	.setStyle(ButtonStyle.Primary);

export const excusionRows = new ActionRowBuilder<ButtonBuilder>().addComponents(
	applyButton,
);

const approveButton = new ButtonBuilder()
	.setCustomId('excusion_approve')
	.setLabel('승인')
	.setStyle(ButtonStyle.Success);

const rejectButton = new ButtonBuilder()
	.setCustomId('excusion_reject')
	.setLabel('거절')
	.setStyle(ButtonStyle.Danger);

export const approvalRows = new ActionRowBuilder<ButtonBuilder>().addComponents(
	approveButton,
	rejectButton,
);
