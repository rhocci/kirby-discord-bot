import { Dayjs } from 'dayjs';
import supabase from '@/supabase/index.js';

const PANALTY_COST = {
	late_before_12: 1_000,
	late_after_12: 5_000,
	absent: 10_000,
};

async function getWeeklyLog(today: Dayjs) {
	const startOfWeek = today.startOf('week').format('YYYY-MM-DD');
	const endOfWeek = today.endOf('week').format('YYYY-MM-DD');

	const { data: weeklyData, error: weeklyError } = await supabase
		.from('attendance_log')
		.select('date, member_id, status')
		.gte('date', startOfWeek)
		.lte('date', endOfWeek);

	if (!weeklyData) {
		return console.log('반환된 데이터 없음');
	}

	if (weeklyError) {
		return console.error(`주간 데이터 불러오기 실패: ${weeklyError}`);
	}

	return weeklyData;
}

export function createWeeklyStats(today: Dayjs) {
	const weeklyLog = getWeeklyLog(today);
}
