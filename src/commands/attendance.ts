import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import dayjs from 'dayjs';
import { colors } from '@/styles/palette.js';

type Attendance = 'check_in' | 'check_out';
type Status =
	| 'absent'
	| 'present'
	| 'late_before_12'
	| 'late_after_12'
	| 'excused';

const TIME = {
	available: dayjs().hour(8).minute(0).second(0).millisecond(0),
	day_start: dayjs().hour(10).minute(0).second(0).millisecond(0),
	day_lunch: dayjs().hour(12).minute(0).second(0).millisecond(0),
	day_end: dayjs().hour(16).minute(0).second(0).millisecond(0),
};

export const checkinCommand = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('입실')
		.setDescription('입실 체크를 하는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => handleAttendance(i, 'check_in'),
};

export const checkoutCommand = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('퇴실')
		.setDescription('퇴실 체크를 하는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => handleAttendance(i, 'check_out'),
};

async function handleAttendance(
	interaction: ChatInputCommandInteraction,
	type: Attendance,
) {
	const attendanceTime = dayjs();
	let message: string = '';
	let status: Status = 'absent';

	if (type === 'check_in') {
		if (
			attendanceTime.isAfter(TIME.available) &&
			attendanceTime.isSame(TIME.day_start)
		) {
			message = '입실 완료!';
			status = 'present';
		} else if (
			attendanceTime.isAfter(TIME.day_start) &&
			attendanceTime.isSame(TIME.day_lunch)
		) {
			message = '입실 완료!(12시 전 지각)';
			status = 'late_before_12';
		} else if (
			attendanceTime.isAfter(TIME.day_lunch) &&
			attendanceTime.isSame(TIME.day_end)
		) {
			message = '입실 완료!(12시 이후 지각)';
			status = 'late_after_12';
		} else {
			message = '입실 체크 시간이 아닙니다. (AM 08:00 ~ PM 17:59)';
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
	// 	.eq('date', attendanceTime.format('YYYY-MM-DD'));

	// if (attendanceError) {
	// 	console.error(attendanceError.message);
	// 	return;
	// }

	console.log(
		`[${attendanceTime.format('HH:mm')}] ${interaction.user.username} ${message}`,
	);

	const embed = new EmbedBuilder()
		.setColor(colors.neon.green)
		.setAuthor({
			name: interaction.user.username,
			iconURL: interaction.user.avatar || undefined,
		})
		.setDescription(message)
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
}
