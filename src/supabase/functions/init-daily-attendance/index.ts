import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import dayjs from 'https://esm.sh/dayjs@1.11.10';
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone';
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc';
import type { Database } from '../../types/database.types.ts';

dayjs.extend(utc);
dayjs.extend(timezone);

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error('Missing environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
	try {
		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

		const { data: holidayData } = await supabase
			.from('holidays')
			.select('name')
			.eq('date', today)
			.maybeSingle();

		const isHoliday = !!holidayData;

		const { data: members, error: memberError } = await supabase
			.from('members')
			.select('id')
			.eq('is_active', true);

		if (!members || memberError) throw new Error('멤버 조회 실패');

		const dailyLog = members.map((member) => ({
			date: today,
			member_id: member.id,
			status: isHoliday ? 'excused' : 'absent',
		}));

		const { error: insertError } = await supabase
			.from('attendance_log')
			.upsert(dailyLog, { onConflict: 'date, member_id' });

		if (insertError) throw new Error('출석 로그 생성 실패');

		return new Response(
			JSON.stringify({
				message: 'Attendance initialized success',
			}),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 200,
			},
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return new Response(JSON.stringify({ error: message }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500,
		});
	}
});
