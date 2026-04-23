import 'node:process';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const INTERVAL_MS = (parseInt(process.env.INTERVAL_MINUTES ?? '30', 10)) * 60 * 1000;

if (!WEBHOOK_URL) {
  console.error('Missing DISCORD_WEBHOOK_URL environment variable.');
  process.exit(1);
}

async function ping() {
  // Post a message with wait=true so we get the message ID back
  const postRes = await fetch(`${WEBHOOK_URL}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '​' }), // zero-width space — renders as blank
  });

  if (!postRes.ok) {
    console.error(`[${new Date().toISOString()}] POST failed: ${postRes.status}`);
    return;
  }

  const msg = await postRes.json();

  // Immediately delete it so nothing is visible in chat
  const delRes = await fetch(`${WEBHOOK_URL}/messages/${msg.id}`, {
    method: 'DELETE',
  });

  if (delRes.ok) {
    console.log(`[${new Date().toISOString()}] Ping sent and deleted (id: ${msg.id})`);
  } else {
    console.error(`[${new Date().toISOString()}] DELETE failed: ${delRes.status}`);
  }
}

console.log(`Discord keepalive started — pinging every ${INTERVAL_MS / 60000} minutes.`);
ping();
setInterval(ping, INTERVAL_MS);
