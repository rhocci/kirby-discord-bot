import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('입실')
		.setDescription('입실 체크를 하는 명령어입니다.'),
	execute,
};

async function execute(interaction: ChatInputCommandInteraction) {
	console.log(`${interaction.user.username} 입실 체크 완료`);
	await interaction.reply('입실함');
}
