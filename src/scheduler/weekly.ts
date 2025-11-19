import { Dayjs } from 'dayjs';
import supabase from '@/supabase/index.js';

const PANALTY_COST = {
	late_before_12: 1_000,
	late_after_12: 5_000,
	absent: 10_000,
};

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

export async function getWeeklyLog(
	today: Dayjs,
): Promise<void | WeeklyMemberLog[]> {
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

export async function createWeeklyStats(today: Dayjs) {
	const weeklyLog = await getWeeklyLog(today);
	console.log(weeklyLog);
}
