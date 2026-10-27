import { Client, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } from '@discordjs/voice';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

if (!TOKEN || !GUILD_ID || !CHANNEL_ID) {
  console.error('Missing required env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_CHANNEL_ID');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

function join() {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error('Guild not found — check DISCORD_GUILD_ID');
    return;
  }

  const connection = joinVoiceChannel({
    channelId: CHANNEL_ID,
    guildId: GUILD_ID,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      // Try to reconnect if briefly disconnected
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      // Full reconnect
      console.log(`[${new Date().toISOString()}] Reconnecting...`);
      connection.destroy();
      join();
    }
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[${new Date().toISOString()}] Joined voice channel — sitting silently.`);
  });
}

let failedChecks = 0;

function checkConnection() {
  const connection = getVoiceConnection(GUILD_ID);
  const me = client.guilds.cache.get(GUILD_ID)?.members.me;
  const healthy = connection?.state.status === VoiceConnectionStatus.Ready && me?.voice.channelId === CHANNEL_ID;

  if (healthy) {
    failedChecks = 0;
    return;
  }

  // Wait for a second failed check so normal reconnects aren't interrupted
  if (++failedChecks < 2) return;

  console.log(`[${new Date().toISOString()}] Health check: not in voice channel, rejoining...`);
  failedChecks = 0;
  connection?.destroy();
  join();
}

client.once('clientReady', () => {
  console.log(`[${new Date().toISOString()}] Logged in as ${client.user.tag}`);
  join();
  setInterval(checkConnection, 60_000);
});

client.login(TOKEN);
