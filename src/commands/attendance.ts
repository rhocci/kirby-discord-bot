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

	await interaction.deferReply();

	const attendance: {
		userId: string;
		time: Dayjs;
		command: string;
		thumbnail: { attach: string; url: string };
		message?: string;
	} = {
		userId: interaction.user.id,
		time: dayjs(interaction.createdTimestamp).tz('Asia/Seoul'),
		command: interaction.commandName,
		thumbnail: IMAGE.so,
	};

	const commandText = attendance.command === 'check_in' ? '입실' : '퇴실';

	try {
		const log = await fetchAttendanceLog({
			user_id: attendance.userId,
			date: attendance.time.format('YYYY-MM-DD'),
		});

		const result = await updateAttendanceLog({
			log,
			command: attendance.command,
			time: attendance.time,
		});

		attendance.message =
			`${commandText} 체크 ` +
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
				name: log.username,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setThumbnail(attendance.thumbnail.url)
			.setDescription(attendance.message)
			.setFooter({ text: `${attendance.time.format('YYYY-MM-DD HH:mm')}` });

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
		await interaction.editReply(`${commandText} 체크 실패!` + `\n(서버 오류)`);
	}
}

async function fetchAttendanceLog({
	user_id,
	date,
}: {
	user_id: string;
	date: string;
}) {
	let log: {
		id: string;
		status: string;
		username: string;
		checked: { in: boolean; out: boolean };
	} | null = null;

	const { data: memberData, error: memberError } = await supabase
		.from('members')
		.select('id, name')
		.eq('discord_id', user_id)
		.single();

	if (!memberData || memberError) {
		throw new Error('유효하지 않은 멤버');
	} else {
		const { data: attendanceLog, error: selectError } = await supabase
			.from('attendance_log')
			.select('id, status, check_in, check_out')
			.eq('member_id', memberData.id)
			.eq('date', date)
			.single();

		if (selectError) {
			throw new Error('DB 조회 실패');
		} else {
			log = {
				...attendanceLog,
				username: memberData.name,
				checked: {
					in: !!attendanceLog.check_in,
					out: !!attendanceLog.check_out,
				},
			};
		}
	}

	return log;
}

async function updateAttendanceLog({
	log,
	command,
	time,
}: {
	log: {
		id: string;
		status: string;
		username: string;
		checked: { in: boolean; out: boolean };
	};
	command: string;
	time: Dayjs;
}) {
	const result: {
		isChecked: boolean;
		status: AttendanceStatus;
		message: string;
	} = {
		isChecked: false,
		status: 'present',
		message: '',
	};

	if (log.status === 'excused') {
		result.message = '공결 처리된 날짜';
	} else {
		switch (command) {
			case 'check_in': {
				if (log.checked.in) {
					result.message = '(이미 입실한 날짜)';
					break;
				}
				if (time.isBefore(available) || time.isAfter(day_end)) {
					result.message = '(입실 가능 시간: 08:00 - 15:59)';
					break;
				}

				result.status = time.isBefore(day_start)
					? 'present'
					: time.isBefore(day_lunch)
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
						break;
					}

					result.isChecked = true;
					result.message = '스터디룸에 입장해 주세요.';
				} catch (err) {
					result.isChecked = false;
					result.message = '(예기치 못한 오류)';
					console.error(err);
				}

				break;
			}
			case 'check_out': {
				if (time.isBefore(day_end)) {
					result.message = '(퇴실 가능 시간: 16:00 - 23:59)';
					break;
				}
				if (!log.checked.in) {
					result.message = '(입실하지 않은 날짜)';
					break;
				}
				if (log.checked.out) {
					result.message = '(이미 퇴실한 날짜)';
					break;
				}

				try {
					const { error: updateError } = await supabase
						.from('attendance_log')
						.update({
							check_out: time.format(),
						})
						.eq('id', log.id);

					if (updateError) {
						throw new Error('DB 업데이트 실패');
					}

					result.isChecked = true;
					result.message = '학습 기록을 작성해 주세요.';

					console.log(
						`[${time.format('HH:mm')}] ${log.username} ${command} => ${result.status}`,
					);
				} catch (err) {
					result.isChecked = false;
					result.message = '(예기치 못한 오류)';
					console.error(err);
				}
				break;
			}
		}
	}

	return result;
}
