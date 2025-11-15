import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import dayjs from 'dayjs';
import { colors } from '@/styles/palette.js';

const TIME = {
	available: dayjs().hour(8).minute(0).second(0).millisecond(0),
	day_start: dayjs().hour(10).minute(0).second(0).millisecond(0),
	day_lunch: dayjs().hour(12).minute(0).second(0).millisecond(0),
	day_end: dayjs().hour(16).minute(0).second(0).millisecond(0),
};

const checkinCommand = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('check_in')
		.setNameLocalization('ko', '입실')
		.setDescription('입실 체크를 하는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => handleAttendance(i),
};

const checkoutCommand = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('check_out')
		.setNameLocalization('ko', '퇴실')
		.setDescription('퇴실 체크를 하는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => handleAttendance(i),
};

async function handleAttendance(interaction: ChatInputCommandInteraction) {
	if (interaction.channelId !== '1430825863926251560') return;

	const attendance: {
		time: any;
		isChecked: boolean;
		message?: string;
		status?: 'absent' | 'present' | 'late_before_12' | 'late_after_12';
	} = {
		time: dayjs(interaction.createdTimestamp),
		isChecked: false,
	};

	if (interaction.commandName === 'check_in') {
		if (
			attendance.time >= TIME.available &&
			attendance.time <= TIME.day_start
		) {
			attendance.isChecked = true;
			attendance.message = '입실 체크 완료!\n스터디룸에 입장해 주세요.';
			attendance.status = 'present';
		} else if (
			attendance.time > TIME.day_start &&
			attendance.time <= TIME.day_lunch
		) {
			attendance.isChecked = true;
			attendance.message =
				'입실 체크 완료!\n스터디룸에 입장해 주세요. (12시 전 지각)';
			attendance.status = 'late_before_12';
		} else if (
			attendance.time > TIME.day_lunch &&
			attendance.time < TIME.day_end
		) {
			attendance.isChecked = true;
			attendance.message =
				'입실 체크 완료!\n스터디룸에 입장해 주세요. (12시 이후 지각)';
			attendance.status = 'late_after_12';
		} else {
			attendance.message = '입실 체크 시간이 아닙니다.\n(AM 08:00 ~ PM 17:59)';
		}
	}

	// const { data: memberData, error: memberError } = await supabase
	// 	.from('members')
	// 	.select('id')
	// 	.eq('discord_id', interaction.user.id);

	// if (!memberData || memberError) {
	// 	console.error(memberError.message);
	// 	return;
	// }

	// const { error: attendanceError } = await supabase
	// 	.from('attendance_log')
	// 	.update({ status })
	// 	.eq('member_id', memberData?.id)
	// 	.eq('date', attendance.time.format('YYYY-MM-DD'));

	// if (attendanceError) {
	// 	console.error(attendanceError.message);
	// 	return;
	// }

	console.log(
		`[${attendance.time.format('HH:mm')}] ${interaction.user.displayName} ${attendance.message}`,
	);

	const embed = new EmbedBuilder()
		.setColor(attendance.isChecked ? colors.neon.green : colors.neon.red)
		.setAuthor({
			name: interaction.user.displayName,
			iconURL: interaction.user.displayAvatarURL(),
		})
		.setDescription(attendance.message ?? '출석 체크 오류')
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
}

export default {
	checkinCommand,
	checkoutCommand,
};
