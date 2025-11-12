import {
	ChannelType,
	type Client,
	EmbedBuilder,
	ThreadAutoArchiveDuration,
} from 'discord.js';
import dayjs from 'dayjs';
import excusionRows from '@/commands/excusion.js';
import { colors } from '@/styles/palette.js';
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
		reason: '일일 공결신청 스레드 생성',
	});

	const embed = new EmbedBuilder()
		.setTitle('📌 공결 신청하기')
		.setDescription('주의사항을 읽고 아래 버튼을 눌러 신청하세요.')
		.addFields(
			{
				name: '1. 명확하고 납득 가능한 사유를 기입해주세요.',
				value: '사유가 부적절하다고 판단될 시 신청이 반려될 수 있습니다.',
			},
			{
				name: '2. 공결은 당일 하루만 신청 가능합니다.',
				value:
					'신청 기한이 지났거나 미리 신청하고 싶을 경우 관리자에게 문의하세요.',
			},
			{
				name: '3. 신청 메세지가 생성되면 수동 승인을 거쳐 출석에 반영됩니다.',
				value: '(체크 이모지 리액션이 달리면 승인된 것)',
			},
		)
		.setColor(colors.neon.pink);

	await thread.send({
		embeds: [embed],
		components: [excusionRows],
	});

	console.log(`- 공결신청 스레드 생성 완료: ${thread.name}`);
}
