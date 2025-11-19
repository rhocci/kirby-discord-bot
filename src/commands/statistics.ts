import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import dayjs from 'dayjs';
import { getWeeklyLog } from '@/scheduler/weekly.js';
import { colors } from '@/styles/palette.js';

export const statsCommand = {
	data: new SlashCommandBuilder()
		.setName('view_stats')
		.setNameLocalization('ko', '통계')
		.setDescription('주간 통계를 띄우는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => viewStats(i),
};

async function viewStats(interaction: ChatInputCommandInteraction) {
	const today = dayjs().tz('Asia/Seoul');
	const startOfWeek = today.startOf('week').format('YYYY-MM-DD');
	const endOfWeek = today.endOf('week').format('YYYY-MM-DD');

	const weeklyLog = await getWeeklyLog(today);
	const statsChannel = await interaction.client.channels
		.fetch('1440523067343372429')
		.catch(() => null);

	if (!statsChannel || !(statsChannel.type === ChannelType.GuildText)) {
		return console.error('유효하지 않은 채널');
	}

	const weeklyStats = new EmbedBuilder()
		.setColor(colors.neon.pink)
		.setTitle('⭐ 금주 주간 통계')
		.setDescription(`${startOfWeek} ~ ${endOfWeek}`)
		.addFields({
			name: '이름 | 출석 | 지각(~12) | 지각(12~) | 결석 | 공결',
			value: '---------------------------------------------------',
		});

	weeklyLog?.forEach((memberLog) => {
		const { present, late_before_12, late_after_12, absent, excused } =
			memberLog.attendance;

		weeklyStats.addFields({
			name: memberLog.name,
			value: `${present} | ${late_before_12} | ${late_after_12} | ${absent} | ${excused}`,
		});
	});

	await statsChannel.send({
		embeds: [weeklyStats],
	});
}
