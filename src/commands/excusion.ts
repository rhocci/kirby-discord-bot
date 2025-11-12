import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const applyButton = new ButtonBuilder()
	.setCustomId('excusion_apply')
	.setLabel('신청하기')
	.setStyle(ButtonStyle.Primary);

const excusionRows = new ActionRowBuilder<ButtonBuilder>().addComponents(
	applyButton,
);

export default excusionRows;
