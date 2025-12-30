import { WSServerPubSub } from 'wsmini';
import { parseCookies } from '../utils/parseCookies.mjs';
import jwt from 'jsonwebtoken';

const origins = process.env.VITE_WS_HOST ?? 'localhost';
const JWT_SECRET = process.env.JWT_SECRET;

function authCallback(token, request) {
  try {
    const cookies = parseCookies(request.headers.cookie);
    const authToken = cookies?.auth_token ?? token;
    const decoded = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
    const username = decoded.sub;

    if (!username) return false;
    if (!/^[A-Za-z]+$/.test(username)) return false;
    if (username.length > 20) return false;

    const color = getColorForUsername(username);
    return { username, color };
  } catch (err) {
    return false;
  }
}

/**
 * WebSocket server instance
 * Note: port is not specified here as it will use the HTTP server port
 */
export const wsServer = new WSServerPubSub({
  origins,
  authCallback,
});

// Add chat channels for real-time messaging
// Channel format: "chat:{matchId}" - enables one channel per conversation
wsServer.addChannel('chat', {
  usersCanPub: true,
  usersCanSub: true,
  hookSub: (clientMetadata, wsServer) => {
    console.log(`User ${clientMetadata.username} subscribed to chat`);
    return true;
  },
  hookPub: (msg, clientMetadata, wsServer) => {
    if (!msg.matchId || !msg.sender || !msg.senderModel || !msg.message) {
      throw new Error('Message must contain: matchId, sender, senderModel, message');
    }
    
    // Validate message size
    if (msg.message.length > 1000) {
      throw new Error('Message too long (max 1000 chars)');
    }

    return {
      matchId: msg.matchId,
      sender: msg.sender,
      senderModel: msg.senderModel,
      message: msg.message,
      timestamp: Date.now()
    };
  }
});
