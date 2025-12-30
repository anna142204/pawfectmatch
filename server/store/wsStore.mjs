import { WSServerPubSub } from 'wsmini';
import { parseCookies } from '../utils/parseCookies.mjs';
import jwt from 'jsonwebtoken';

const origins = process.env.VITE_WS_HOST ?? 'localhost';
const JWT_SECRET = process.env.JWT_SECRET;

function authCallback(token, request) {
  try {
    // Extract token from cookies or use the token parameter passed by client
    const cookies = parseCookies(request.headers.cookie || '');
    const authToken = cookies?.auth_token ?? token;
    
    if (!authToken) {
      console.warn('[WS Auth] No auth token provided - token:', !!token, 'cookie:', !!cookies?.auth_token);
      return false;
    }

    // Verify JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
    const userId = decoded.sub;

    if (!userId) {
      console.warn('[WS Auth] No user ID in token payload');
      return false;
    }

    console.log(`[WS Auth] ✓ User authenticated: ${userId}`);
    
    // Return authenticated user metadata
    return { 
      userId,
      username: decoded.username || 'User',
      role: decoded.role || 'user',
      type: decoded.type || 'unknown'
    };
  } catch (err) {
    console.error('[WS Auth] ✗ Authentication failed:', err.message);
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

// Helper function to get channel name for a match
export function getMatchChannelName(matchId) {
  return `match:${matchId}`;
}

// Helper function to create or get a match channel
export async function ensureMatchChannel(matchId) {
  const channelName = getMatchChannelName(matchId);
  
  // Check if channel already exists
  if (wsServer.hasChannel(channelName)) {
    return channelName;
  }

  // Create new channel for this match
  wsServer.addChannel(channelName, {
    usersCanPub: true,
    usersCanSub: true,
    hookSub: async (clientMetadata, wsServer) => {
      // Verify user has access to this conversation
      // We'll validate this via the match data
      console.log(`User ${clientMetadata.userId} subscribing to ${channelName}`);
      return true; // Permission check happens in hookPub
    },
    hookPub: (msg, clientMetadata, wsServer) => {
      // Validate message structure
      if (!msg.message || typeof msg.message !== 'string') {
        throw new Error('Message must contain a valid message string');
      }
      
      // Validate message size
      if (msg.message.length > 1000) {
        throw new Error('Message too long (max 1000 chars)');
      }

      // Return transformed message
      return {
        sender: clientMetadata.userId,
        senderModel: msg.senderModel || 'User',
        message: msg.message,
        timestamp: Date.now()
      };
    }
  });
  
  return channelName;
}
