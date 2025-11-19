import type { Client } from 'discord.js';
import dayjs from 'dayjs';
import nodeCron from 'node-cron';
import {
	alertLunchTime,
	createDailyThread,
	initDailyAttendance,
} from '@/scheduler/daily.js';
import { createWeeklyStats } from '@/scheduler/weekly.js';

export function initSchedulers(client: Client) {
	/** 평일 자정 태스크
	 * 1. 출석 로그에다 모든 멤버 기본값으로 insert(날짜만 당일로) v
	 * 2. 당일 공결신청 스레드 생성/예시 템플릿 고정
	 * 3. 전날 스레드 권한 조정(가능하면)
	 */
	nodeCron.schedule(
		'0 0 * * 1-5',
		() => {
			const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

			console.log(
				`====================\n${today} 일간(00시)\n====================`,
			);

			initDailyAttendance();
			createDailyThread(client);
		},
		{ timezone: 'Asia/Seoul' },
	);

	/** 평일 12시 태스크
	 * 1. 점심식사 알림
	 */
	nodeCron.schedule(
		'0 12 * * 1-5',
		() => {
			const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

			console.log(
				`====================\n${today} 일간(12시)\n====================`,
			);
			alertLunchTime(client, 'start');
		},
		{ timezone: 'Asia/Seoul' },
	);

	/** 평일 13시 태스크
	 * 1. 점심식사 종료 알림
	 */
	nodeCron.schedule(
		'0 13 * * 1-5',
		() => {
			const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

			console.log(
				`====================\n${today} 일간(13시)\n====================`,
			);
			alertLunchTime(client, 'end');
		},
		{ timezone: 'Asia/Seoul' },
	);

	/** 주간(토요일) 자정 태스크
	 * 1. 금주 출석현황/지각비 정산 통계 업로드
	 */
	nodeCron.schedule(
		'0 0 * * 6',
		() => {
			const today = dayjs().tz('Asia/Seoul');

			console.log(
				`====================\n${today.format('YYYY-MM-DD')} 주간(00시)\n====================`,
			);
			createWeeklyStats(client);
		},
		{ timezone: 'Asia/Seoul' },
	);
}
