import { Client, Events, IntentsBitField } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const intents = new IntentsBitField().add(
  IntentsBitField.Flags.Guilds,
  IntentsBitField.Flags.GuildMessages,
  IntentsBitField.Flags.MessageContent,
  IntentsBitField.Flags.GuildVoiceStates,
);
const client = new Client({ intents });

client.once(Events.ClientReady, readyClient => {
  console.log(`봇 준비 완료! ${readyClient.user.tag}`);
});

client.login(token);
