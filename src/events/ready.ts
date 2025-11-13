import { initSchedulers } from '@/scheduler/index.js';
import { Client, Events } from 'discord.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		console.log(`봇 준비 완료! ${client.user?.tag}`);
		initSchedulers(client);
	},
};
