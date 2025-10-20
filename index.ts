import { Client, Events, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`봇 준비 완료! ${readyClient.user.tag}`);
});

client.login(token);
