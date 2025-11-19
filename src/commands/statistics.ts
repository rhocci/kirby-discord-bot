import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import dayjs, { Dayjs } from 'dayjs';
import { getWeeklyLog } from '@/scheduler/weekly.js';
import { colors } from '@/styles/palette.js';

export const statsCommand = {
	data: new SlashCommandBuilder()
		.setName('view_stats')
		.setNameLocalization('ko', '통계')
		.setDescription('주간 통계를 띄우는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => createWeeklyStats(i),
};

function getWeekOfMonth(date: Dayjs) {
	const firstDayOfMonth = date.startOf('month');
	const firstWeekday = firstDayOfMonth.day();

	const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
	const dayOfMonth = date.date();

	return Math.ceil((dayOfMonth + offset) / 7);
}

async function createWeeklyStats(interaction: ChatInputCommandInteraction) {
	const today = dayjs().tz('Asia/Seoul');
	const weekOfMonth = getWeekOfMonth(today);
	const startOfWeek = today.startOf('week');
	const endOfWeek = today.endOf('week');

	const weeklyLog = await getWeeklyLog(today);
	const statsChannel = await interaction.client.channels
		.fetch('1440551220547948776')
		.catch(() => null);

	if (!statsChannel || !(statsChannel.type === ChannelType.GuildText)) {
		return console.error('유효하지 않은 채널');
	}

	const panaltiedMembers: string[] = [];

	const header = '구성원  | 출석 | 지각(A|P) | 결석 | 지각비';
	const divider = '='.repeat(41);
	const rows = weeklyLog?.map((memberLog) => {
		let { present, late_before_12, late_after_12, excused } =
			memberLog.attendance;
		let panalty = 0;

		for (let i = 0; i < 3; i++) {
			if (present) {
				present--;
				continue;
			}
			if (excused) {
				excused--;
				continue;
			}
			if (late_before_12) {
				panalty += 1_000;
				late_before_12--;
				continue;
			}
			if (late_after_12) {
				panalty += 5_000;
				late_after_12--;
				continue;
			}
			panalty += 1_0000;
		}

		if (panalty) panaltiedMembers.push(memberLog.id);

		return (
			`${memberLog.name.padEnd(4, ' ')} |` +
			`  ${memberLog.attendance.present + memberLog.attendance.excused}  |` +
			`  ${memberLog.attendance.late_before_12}  |  ${memberLog.attendance.late_after_12}  |` +
			`  ${memberLog.attendance.absent}  |` +
			` ￦ ${panalty}`
		);
	});

	const statsTable = `\`\`\`\n${header}\n${divider}\n${rows?.join('\n')}\n\`\`\``;
	const message =
		panaltiedMembers.length === 0
			? '이번 주는 지각/결석자가 없어요!'
			: '지각/결석자' +
				panaltiedMembers.map((id) => `<@${id}>`).join(', ') +
				' 님은\n**이번 주 일요일 자정**까지 모임 통장에 지각비를 입금해주세요!';

	const weeklyStats = new EmbedBuilder()
		.setColor(colors.neon.pink)
		.setTitle(`⭐ ${today.format('M')}월 ${weekOfMonth}주차 출석 통계`)
		.setDescription(
			`| **${startOfWeek.format('YYYY-MM-DD')} ~ ${endOfWeek.format('YYYY-MM-DD')}**
      금주 출석 및 지각비 정산 일람\n
      ${message}\n`,
		)
		.setFields({ name: '✅ 출석 현황', value: statsTable })
		.setFooter({ text: '※ 출석 횟수는 승인된 공결을 포함한 수치입니다.' });

	await statsChannel.send({
		embeds: [weeklyStats],
	});
}
