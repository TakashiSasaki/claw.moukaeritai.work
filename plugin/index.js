import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const API_ENDPOINT_URL = process.env.API_ENDPOINT_URL || 'http://localhost:3000/api/heartbeat';
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'default_secret';
const PC_NAME = process.env.OPENCLAW_PC_NAME || os.hostname() || 'unknown-pc';
const TELEGRAM_URL = process.env.TELEGRAM_CHANNEL_URL || '';

let intervalId = null;

async function sendHeartbeat(api) {
  try {
    const payload = {
      pc_name: PC_NAME,
      status: 'online',
      version: '1.0.0', // This could be dynamically resolved
      current_task: api && api.getState ? api.getState().currentTask || 'idle' : 'idle',
      telegram_url: TELEGRAM_URL,
    };

    const response = await fetch(API_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[Dashboard Plugin] Failed to send heartbeat: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Crucial: catch any network/fetch error to avoid crashing the main process
    console.error('[Dashboard Plugin] Error sending heartbeat:', error.message);
  }
}

export default {
  registerFull(api) {
    console.log(`[Dashboard Plugin] Registered on ${PC_NAME}. Starting heartbeat...`);
    
    // Initial heartbeat
    sendHeartbeat(api);
    
    // Send heartbeat every 60 seconds
    intervalId = setInterval(() => sendHeartbeat(api), 60000);

    // Provide cleanup mechanism if the API supports it
    if (api && typeof api.onShutdown === 'function') {
      api.onShutdown(() => {
        if (intervalId) {
          clearInterval(intervalId);
          console.log('[Dashboard Plugin] Cleaned up heartbeat interval.');
        }
      });
    }
  }
};
