import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import dayjs, { Dayjs } from 'dayjs';
import path from 'path';
import { TODAY_TIME_SLOTS } from '@/scheduler/daily.js';
import { colors } from '@/styles/palette.js';
import supabase from '@/supabase/index.js';
import { createImgPath } from '@/utils/createImgPath.js';

type AttendanceStatus =
	| 'absent'
	| 'present'
	| 'late_before_12'
	| 'late_after_12'
	| 'excused';

const { available, day_start, day_lunch, day_end } = TODAY_TIME_SLOTS;

const IMAGE = {
	hi: createImgPath('hi.png'),
	cry: createImgPath('cry.png'),
	good: createImgPath('good.png'),
	so: createImgPath('so.png'),
};

export const checkinCommand = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('check_in')
		.setNameLocalization('ko', '입실')
		.setDescription('입실 체크를 하는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => handleAttendance(i),
};

export const checkoutCommand = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('check_out')
		.setNameLocalization('ko', '퇴실')
		.setDescription('퇴실 체크를 하는 명령어입니다.'),
	execute: (i: ChatInputCommandInteraction) => handleAttendance(i),
};

async function handleAttendance(interaction: ChatInputCommandInteraction) {
	if (interaction.channelId !== '1430825863926251560')
		return await interaction.reply({
			content: '유효하지 않은 채널입니다.',
			ephemeral: true,
		});

	await interaction.deferReply({ ephemeral: true });

	const attendance: {
		username: string;
		time: Dayjs;
		command: string;
		commandName: string;
		thumbnail: any;
		message: string;
	} = {
		username: interaction.user.username,
		time: dayjs(interaction.createdTimestamp).tz('Asia/Seoul'),
		command: interaction.command?.name!,
		commandName: interaction.command?.nameLocalized || '',
		thumbnail: IMAGE.so ?? null,
		message: '',
	};

	try {
		const log = await fetchAttendanceLog({
			user_id: attendance.username,
			date: attendance.time.format('YYYY-MM-DD'),
		});

		if (log.status === 'excused') {
			attendance.message =
				`${attendance.commandName} 체크 실패!` + `\n(공결 처리된 날짜)`;
			return;
		}

		const result = await updateAttendanceLog({
			log,
			command: interaction.command?.name,
			time: attendance.time,
		});

		attendance.message =
			`${attendance.commandName} 체크 ` +
			`${result.isChecked ? '성공' : '실패'}!\n` +
			`${result.message}`;

		if (result.isChecked) {
			attendance.thumbnail =
				attendance.command === 'check_in'
					? result.status === 'present'
						? IMAGE.hi
						: IMAGE.cry
					: IMAGE.good;
		}

		const embed = new EmbedBuilder()
			.setColor(result.isChecked ? colors.neon.green : colors.neon.red)
			.setAuthor({
				name: attendance.username,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setThumbnail(attendance.thumbnail.url)
			.setDescription(attendance.message)
			.setFooter({ text: `${attendance.time.format('YYYY-MM-DD-T HH:mm')}` });

		await interaction.editReply({
			embeds: [embed],
			files: [
				{
					attachment: attendance.thumbnail.attach,
					name: path.basename(attendance.thumbnail.attach),
				},
			],
		});
	} catch (err) {
		console.error(err);
	}
}

async function fetchAttendanceLog({
	user_id,
	date,
}: {
	user_id: string;
	date: string;
}) {
	const { data: memberData, error: memberError } = await supabase
		.from('members')
		.select('id, name')
		.eq('discord_id', user_id)
		.single();

	if (memberError) {
		throw new Error(memberError.message);
	}

	const { data: attendanceLog, error: selectError } = await supabase
		.from('attendance_log')
		.select('date, id, member_id, status')
		.eq('member_id', memberData.id)
		.eq('date', date)
		.single();

	if (selectError) {
		throw new Error(selectError.message);
	}

	return attendanceLog;
}

async function updateAttendanceLog({
	log,
	command,
	time,
}: {
	log: { date: string; id: string; member_id: string; status: string | null };
	command?: string;
	time: Dayjs;
}) {
	const result: {
		isChecked: Boolean;
		status: AttendanceStatus;
		message: string;
	} = {
		isChecked: false,
		status: 'present',
		message: '',
	};

	switch (command) {
		case 'check_in': {
			if (log.status !== 'absent') {
				result.message = '(이미 입실한 날짜)';
				break;
			}
			if (time < available || time >= day_end) {
				result.message = '(입실 가능 시간: 08:00 - 15:59)';
				break;
			}

			result.status =
				time <= day_start
					? 'present'
					: time <= day_lunch
						? 'late_before_12'
						: 'late_after_12';

			try {
				const { error: updateError } = await supabase
					.from('attendance_log')
					.update({
						status: result.status,
						[command]: time.format(),
					})
					.eq('id', log.id);

				if (updateError) {
					result.message = '(서버 오류)';
					console.error(updateError);
				}

				result.isChecked = true;
				result.message = '스터디룸에 입장해 주세요.';
			} catch (err) {
				result.message = '(예기치 못한 오류)';
				console.error(err);
			}

			break;
		}
		case 'check_out': {
			if (log.status === 'absent') {
				result.message = '(입실하지 않은 날짜)';
				break;
			}
			if (time < day_end || time <= available) {
				result.message = '(퇴실 가능 시간: 16:00 - 23:59)';
				break;
			}

			result.isChecked = true;
			result.message = '학습 기록을 작성해 주세요.';

			break;
		}
	}

	console.log(
		`[${time.format('HH:mm')}] ${log.member_id} ${command} => ${result.status}`,
	);

	return result;
}
