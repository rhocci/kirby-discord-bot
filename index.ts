import { Client, Events, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import dayjs from 'dayjs';
import fs from 'fs';

const token = process.env.DISCORD_TOKEN;

const PREFIX = '!';
const attendanceLog = './data/attendance.json';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`봇 준비 완료! : ${readyClient.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(' ');
  const command = args.shift()?.toLowerCase();

  if (command === '출석') {
    const username = message.author.username;
    const now = dayjs().format('HH:mm');
    const today = dayjs().format('YYYY-MM-DD');

    const startOfWeek = dayjs().startOf('week').add(1, 'day');
    const endOfWeek = dayjs().add(4, 'day');

    let logs: any = {};
    if (fs.existsSync(attendanceLog)) {
      logs = JSON.parse(fs.readFileSync(attendanceLog, 'utf-8'));
    }

    if (!logs[today]) logs[today] = [];

    if (logs[today].find((entry: any) => entry.name === username)) {
      await message.reply({
        content: `✴️ 오늘은 이미 출석했어요!\n출석 일시: ${
          logs[today].find((entry: any) => entry.name === username).time
        }`,
      });
      return;
    }

    logs[today].push({ name: username, time: now });
    fs.writeFileSync(attendanceLog, JSON.stringify(logs, null, 2));

    const attendanceOfWeek = Object.entries(logs)
      .filter(([date]) => {
        const d = dayjs(date);
        return (
          d.isAfter(startOfWeek.subtract(1, 'day')) &&
          d.isBefore(endOfWeek.add(1, 'day'))
        );
      })
      .flatMap(([_, records]) => records)
      .filter((entry: any) => entry.name === username).length;

    await message.reply({
      content: `✅ ${username}님 출석 완료!\n출석 일시: ${today} ${now}\n이번 주 출석 횟수: ${attendanceOfWeek} / 5 회`,
    });
  }
});

client.login(token);
