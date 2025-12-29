import { ChannelType, type Client, EmbedBuilder } from 'discord.js';
import dayjs from 'dayjs';
import nodeCron from 'node-cron';
import {
	alertLunchTime,
	createDailyThread,
	initDailyAttendance,
} from '@/scheduler/daily.js';
import { createWeeklyStats } from '@/scheduler/weekly.js';
import { colors } from '@/styles/palette.js';
import supabase from '@/supabase/index.js';

export function initSchedulers(client: Client) {
	/** 평일 자정 태스크
	 * 1. 출석 로그에다 모든 멤버 기본값으로 insert(날짜만 당일로)
	 * 2. 당일 공결신청 스레드 생성/예시 템플릿 고정
	 * 3. 공휴일일 시 전원 공결+휴일 알림으로 대체
	 */
	nodeCron.schedule('0 15 * * 0-4', async () => {
		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

		console.log(
			`====================\n${today} 일간(00시)\n====================`,
		);

		const { data: holidayData, error } = await supabase
			.from('holidays')
			.select('name')
			.eq('date', today)
			.maybeSingle();

		if (error) {
			console.error('공휴일 체크 실패: ', error.message);
		}

		const isHoliday = !!holidayData;

		await initDailyAttendance(isHoliday);

		if (isHoliday) {
			const defaultChannel = await client.channels
				.fetch('1429832677531586626')
				.catch(() => null);

			if (!defaultChannel || !(defaultChannel.type === ChannelType.GuildText)) {
				return console.error('유효하지 않은 채널');
			}

			const embed = new EmbedBuilder()
				.setColor(colors.neon.blue)
				.setTitle('⭐ 공휴일 안내')
				.setDescription(
					`오늘은 **${holidayData.name}**입니다!\n푹 쉬시고 내일 만나요~`,
				)
				.setTimestamp();

			await defaultChannel.send({
				embeds: [embed],
			});

			return console.log('공휴일 알림 생성 완료');
		}

		await createDailyThread(client);
	});

	/** 평일 12시 태스크
	 * 1. 점심식사 알림
	 */
	nodeCron.schedule('0 3 * * 1-5', async () => {
		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

		console.log(
			`====================\n${today} 일간(12시)\n====================`,
		);
		await alertLunchTime(client, 'start');
	});

	/** 평일 13시 태스크
	 * 1. 점심식사 종료 알림
	 */
	nodeCron.schedule('0 4 * * 1-5', async () => {
		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

		console.log(
			`====================\n${today} 일간(13시)\n====================`,
		);
		await alertLunchTime(client, 'end');
	});

	/** 주간(토요일) 12시 태스크
	 * 1. 금주 출석현황/지각비 정산 통계 업로드
	 */
	nodeCron.schedule('0 15 * * 5', async () => {
		const today = dayjs().tz('Asia/Seoul');

		console.log(
			`====================\n${today.format('YYYY-MM-DD')} 주간(00시)\n====================`,
		);
		await createWeeklyStats(client);
	});
}
