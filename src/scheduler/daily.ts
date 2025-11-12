import {
	ChannelType,
	type Client,
	ThreadAutoArchiveDuration,
} from 'discord.js';
import dayjs from 'dayjs';
import supabase from '@/supabase/index.js';

export async function initDailyAttendance() {
	const date = dayjs().format('YYYY-MM-DD');

	const { data: members, error: memberError } = await supabase
		.from('members')
		.select('id')
		.eq('is_active', true);

	if (!members || memberError) {
		console.log(`- 출석 로그 생성 실패`);
		console.error(`-> ${memberError.message}`);
		return;
	}

	const dailyLog = members.map((member) => ({
		date,
		member_id: member.id,
	}));

	const { error: insertError } = await supabase
		.from('attendance_log')
		.insert(dailyLog);

	if (insertError) {
		console.log(`- 출석 로그 생성 실패`);
		console.error(`-> ${insertError.message}`);
		return;
	}

	console.log(`- 출석 로그 생성 완료: ${members.length}명`);
}

export async function createDailyThread(client: Client) {
	const excusionChannel = await client.channels
		.fetch('1436641965499486329')
		.catch(() => null);

	if (!excusionChannel || !(excusionChannel.type === ChannelType.GuildText)) {
		return console.error('유효하지 않은 채널');
	}

	const date = dayjs().format('YY/MM/DD');
	const message = await excusionChannel.send(`🗓️ **${date} 공결신청**`);
	const thread = await message.startThread({
		name: `🗓️ ${date} 공결신청`,
		autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
		reason: '신청 마감된 스레드입니다. 관리자에게 문의해 주세요.',
	});

	console.log(`- 공결신청 스레드 생성 완료: ${thread.name}`);
}
