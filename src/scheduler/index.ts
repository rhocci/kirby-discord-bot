import { type Client, EmbedBuilder } from 'discord.js';
import dayjs from 'dayjs';
import nodeCron from 'node-cron';
import {
	alertLunchTime,
	checkIsHoliday,
	createDailyThread,
} from '@/scheduler/daily.js';
import { createWeeklyStats } from '@/scheduler/weekly.js';
import { colors } from '@/styles/palette.js';

let cachedIsHoliday = false;

export function initSchedulers(client: Client) {
	const defaultChannelId = process.env.DEFAULT_CHANNEL_ID;

	if (!defaultChannelId)
		return console.error('환경변수 조회 실패: DEFAULT_CHANNEL_ID');

	nodeCron.schedule('0 15 * * 0-4', async () => {
		const defaultChannel = await client.channels
			.fetch(defaultChannelId)
			.catch(() => null);

		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');
		const { isHoliday, holidayName } = await checkIsHoliday();

		cachedIsHoliday = isHoliday;

		console.log(
			`====================\n${today} 일간(00시)\n====================`,
		);

		if (cachedIsHoliday) {
			const embed = new EmbedBuilder()
				.setColor(colors.neon.blue)
				.setTitle('⭐ 공휴일 안내')
				.setDescription(
					`오늘은 **${holidayName}**입니다!\n푹 쉬시고 내일 만나요~`,
				)
				.setTimestamp();

			if (defaultChannel && defaultChannel.isTextBased()) {
				await defaultChannel.send({
					embeds: [embed],
				});
			}

			return console.log('공휴일 알림 생성 완료');
		}

		await createDailyThread(client);
	});

	nodeCron.schedule('0 3 * * 1-5', async () => {
		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

		console.log(
			`====================\n${today} 일간(12시)\n====================`,
		);
		await alertLunchTime(client, 'start', cachedIsHoliday);
	});

	nodeCron.schedule('0 4 * * 1-5', async () => {
		const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

		console.log(
			`====================\n${today} 일간(13시)\n====================`,
		);
		await alertLunchTime(client, 'end', cachedIsHoliday);
	});

	nodeCron.schedule('0 15 * * 5', async () => {
		const today = dayjs().tz('Asia/Seoul');

		console.log(
			`====================\n${today.format('YYYY-MM-DD')} 주간(00시)\n====================`,
		);
		await createWeeklyStats(client);
	});
}
