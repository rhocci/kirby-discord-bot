import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { Database } from '../types/database.types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
	try {
		const date = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

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

		if (!members || memberError)
			throw new Error('Member Error: 멤버 조회 실패');

		const dailyLog = members.map((member) => ({
			date,
			member_id: member.id,
			status: isHoliday ? 'excused' : 'absent',
		}));

		const { error: insertError } = await supabase
			.from('attendance_log')
			.insert(dailyLog, {
				ignoreDuplicates: true,
			} as any);

		if (insertError) throw new Error('Insert Error: 출석 로그 생성 실패');

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
		return new Response(JSON.stringify({ error: err.message }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500,
		});
	}
});
