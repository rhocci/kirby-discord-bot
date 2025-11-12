import { Client, Events } from 'discord.js';
import dayjs from 'dayjs';
import { initSchedulers } from '@/scheduler/index.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		console.log(`봇 준비 완료! ${client.user?.tag}`);
		const today = dayjs().format('YYYY-MM-DD');

		console.log(
			`====================\n${today} 일간(00시)\n====================`,
		);

		initSchedulers(client);
	},
};
