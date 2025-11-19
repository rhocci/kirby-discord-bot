import type { Client } from 'discord.js';
import { ChannelType, EmbedBuilder } from 'discord.js';
import dayjs, { Dayjs } from 'dayjs';
import { colors } from '@/styles/palette.js';
import supabase from '@/supabase/index.js';

type WeeklyMemberLog = {
	id: string;
	name: string;
	attendance: {
		present: number;
		late_before_12: number;
		late_after_12: number;
		absent: number;
		excused: number;
	};
};

async function getWeeklyLog(today: Dayjs): Promise<void | WeeklyMemberLog[]> {
	const startOfWeek = today.startOf('week').format('YYYY-MM-DD');
	const endOfWeek = today.endOf('week').format('YYYY-MM-DD');

	const { data: weeklyData, error: weeklyError } = await supabase
		.from('attendance_log')
		.select(
			`
			status,
			member: members!inner(name, discord_id)
			`,
		)
		.gte('date', startOfWeek)
		.lte('date', endOfWeek)
		.eq('member.is_active', true);

	if (!weeklyData) {
		return console.log('반환된 데이터 없음');
	}

	if (weeklyError) {
		return console.error(`주간 데이터 불러오기 실패: ${weeklyError}`);
	}

	const memberLog = new Map();
	weeklyData.forEach((log) => {
		const { discord_id, name } = log.member;

		if (!memberLog.has(discord_id)) {
			memberLog.set(discord_id, {
				id: discord_id,
				name: name,
				attendance: {
					present: 0,
					late_before_12: 0,
					late_after_12: 0,
					absent: 0,
					excused: 0,
				},
			});
		}

		if (log.status) {
			memberLog.get(discord_id).attendance[log.status]++;
		}
	});

	return Array.from(memberLog.values());
}

function getWeekOfMonth(date: Dayjs) {
	const firstDayOfMonth = date.startOf('month');
	const firstWeekday = firstDayOfMonth.day();

	const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
	const dayOfMonth = date.date();

	return Math.ceil((dayOfMonth + offset) / 7);
}

export async function createWeeklyStats(client: Client) {
	const today = dayjs().tz('Asia/Seoul');
	const weekOfMonth = getWeekOfMonth(today);
	const startOfWeek = today.startOf('week');
	const endOfWeek = today.endOf('week');

	const weeklyLog = await getWeeklyLog(today);
	const statsChannel = await client.channels
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

	try {
		await statsChannel.send({
			embeds: [weeklyStats],
		});

		console.log(
			`주간 통계 생성 성공: ${today.format('M')}월 ${weekOfMonth}주차`,
		);
	} catch (err) {
		console.error(`주간 통계 생성 실패: ${err}`);
	}
}
