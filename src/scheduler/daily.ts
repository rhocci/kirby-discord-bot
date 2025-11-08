import dayjs from 'dayjs';
import supabase from '@/supabase/index.js';

export async function initDailyAttendance() {
	const date = dayjs().format('YYYY-MM-DD');

	const { data: members, error: memberError } = await supabase
		.from('members')
		.select('id')
		.eq('is_active', true);

	if (!members || memberError) {
		return console.error(`멤버 조회 실패: ${memberError}`);
	}

	const dailyLog = members.map((member) => ({
		date,
		member_id: member.id,
	}));

	const { error: insertError } = await supabase
		.from('attendance_log')
		.insert(dailyLog);

	if (insertError) {
		return console.error(`초기 로그 생성 실패: ${insertError}`);
	}

	return console.log(`초기 로그 생성 완료: ${date} / 총 ${members.length}명`);
}
