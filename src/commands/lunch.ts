import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('식사')
		.setDescription('식사 체크를 하는 명령어입니다.'),
	execute,
};

async function execute(interaction: ChatInputCommandInteraction) {
	console.log(`${interaction.user.username} 식사 체크 완료`);
	await interaction.reply('식사');
}
