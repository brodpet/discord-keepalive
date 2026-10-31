import { Client, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } from '@discordjs/voice';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const MIN_REJOIN_GAP = 5_000;
const HEALTH_CHECK_INTERVAL = 15_000;

if (!TOKEN || !GUILD_ID || !CHANNEL_ID) {
  console.error('Missing required env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_CHANNEL_ID');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let lastJoinAt = 0;
let rejoinTimer = null;
let failedChecks = 0;

function isHealthy() {
  const connection = getVoiceConnection(GUILD_ID);
  const me = client.guilds.cache.get(GUILD_ID)?.members.me;
  return connection?.state.status === VoiceConnectionStatus.Ready && me?.voice.channelId === CHANNEL_ID;
}

function join() {
  lastJoinAt = Date.now();
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
      // Skip if this connection was already replaced by another rejoin
      if (connection === getVoiceConnection(GUILD_ID)) rejoin('Voice disconnected');
    }
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[${new Date().toISOString()}] Joined voice channel — sitting silently.`);
  });
}

// Rejoin at most once every MIN_REJOIN_GAP so a channel we can't enter doesn't get spammed
function rejoin(reason) {
  if (rejoinTimer) return;
  const wait = Math.max(0, lastJoinAt + MIN_REJOIN_GAP - Date.now());

  rejoinTimer = setTimeout(() => {
    rejoinTimer = null;
    if (isHealthy()) return;

    console.log(`[${new Date().toISOString()}] ${reason}, rejoining...`);
    const existing = getVoiceConnection(GUILD_ID);
    if (existing && existing.state.status !== VoiceConnectionStatus.Destroyed) existing.destroy();
    join();
  }, wait);
}

function checkConnection() {
  if (isHealthy()) {
    failedChecks = 0;
    return;
  }

  // Wait for a second failed check so normal reconnects aren't interrupted
  if (++failedChecks < 2) return;

  failedChecks = 0;
  rejoin('Health check: not in voice channel');
}

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.id !== client.user.id || newState.guild.id !== GUILD_ID) return;
  if (newState.channelId !== CHANNEL_ID) rejoin('Moved or disconnected from voice channel');
});

client.once('clientReady', () => {
  console.log(`[${new Date().toISOString()}] Logged in as ${client.user.tag}`);
  join();
  setInterval(checkConnection, HEALTH_CHECK_INTERVAL);
});

client.login(TOKEN);
