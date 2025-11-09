import type { Client } from 'discord.js';
import nodeCron from 'node-cron';
import { createDailyThread, initDailyAttendance } from '@/scheduler/daily.js';

export function initSchedulers(client: Client) {
	/** 평일 자정 태스크
	 * 1. 출석 로그에다 모든 멤버 기본값으로 insert(날짜만 당일로) v
	 * 2. 당일 공결신청 스레드 생성/예시 템플릿 고정
	 * 3. 전날 스레드 권한 조정(가능하면)
	 */
	nodeCron.schedule(
		'0 0 * * 1-5',
		() => {
			initDailyAttendance();
			createDailyThread(client);
		},
		{ timezone: 'Asia/Seoul' },
	);

	/** 평일 12시 태스크
	 * 1. 점심식사 알림
	 */
	nodeCron.schedule('0 12 * * 1-5', () => {}, { timezone: 'Asia/Seoul' });

	/** 평일 13시 태스크
	 * 1. 점심식사 종료 알림
	 */
	nodeCron.schedule('0 13 * * 1-5', () => {}, { timezone: 'Asia/Seoul' });

	/** 평일 16시 30분 태스크
	 * 1. 입실만 찍고 퇴실 안찍은사람들 태크(본인만 보이게) 퇴실 알림
	 */
	nodeCron.schedule('30 16 * * 1-5', () => {}, { timezone: 'Asia/Seoul' });

	/** 주간(토요일) 자정 태스크
	 * 1. 금주 출석현황/지각비 정산 통계 업로드
	 */
	nodeCron.schedule('0 0 * * 6', () => {}, { timezone: 'Asia/Seoul' });
}
