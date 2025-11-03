require('dotenv').config();
const { Crisp } = require('crisp-api');
const { createClient } = require('./customRequest');
const { sendMessageToConversation } = require('./crispController');

const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'http://localhost:3001';
const mainClient = createClient(MAIN_BACKEND_URL);

// Create the Crisp client (it lets you access both the REST API and RTM events)
const CrispClient = new Crisp();

// Configure your Crisp authentication tokens ('plugin' token)
const CRISP_IDENTIFIER = process.env.CRISP_IDENTIFIER;
const CRISP_KEY = process.env.CRISP_KEY;
const PAUSE_THRESHOLD_MS = 3000; // 3 seconds

if (!CRISP_IDENTIFIER || !CRISP_KEY) {
  console.error('❌ CRISP_IDENTIFIER and CRISP_KEY must be set in environment variables');
  process.exit(1);
}

CrispClient.authenticateTier('plugin', CRISP_IDENTIFIER, CRISP_KEY);

// Set current RTM mode to WebSockets
CrispClient.setRtmMode(Crisp.RTM_MODES.WebSockets);

const typingTimeout = {};
const messageBuffer = {};

const clearSessionState = (sessionId) => {
  if (typingTimeout[sessionId]) {
    clearTimeout(typingTimeout[sessionId]);
  }
  delete messageBuffer[sessionId];
  delete typingTimeout[sessionId];
};

const createAggregatedResponse = (messages, isRapid) => {
  const combinedContent = messages.join(' '); 
    
  if (isRapid) {
    return `${combinedContent}`;
  } else {
    return `${messages[0]}`;
  }
};

const handleMessagePause = async (sessionId, originMessages) => {
  const messages = messageBuffer[sessionId];
  const messageCount = messages.length;

  // CORE LOGIC FOR RAPID DETECTION:
  // If we collected more than one message, it means the clock was reset 
  // and the sequence was rapid.
  const isRapid = messageCount > 1;

  console.log(`\n[PAUSE DETECTED] Total messages collected: ${messageCount}. Was Rapid: ${isRapid}`);

  if (isRapid) {
    const responseContent = createAggregatedResponse(messages, isRapid);
    console.log('---RAPID Response content:', responseContent);
    const replyMessage = {
      type: 'text',
      from: 'operator',
      origin: 'chat',
      content: "I'm not sure what you mean. Could you please provide more details about the issue you're facing? Please send the whole message in one text so I can help you better."
    };
    await sendMessageToConversation(originMessages.website_id, originMessages.session_id, replyMessage);
  } else {
    console.log('---Websocket sending message:', originMessages);
    mainClient.post('/api/crisp/rtm', originMessages)
    .then(() => {})
    .catch(error => {
      console.error('❌ Error sending message to Main Backend server:', error.message);
    });
  }
  
  // Clean up the state
  clearSessionState(sessionId);
};

// Message event handlers
CrispClient.on('message:send', (message) => {
  if (message.type === 'file') {
    console.log('📨 Received file message:', message);
    mainClient.post('/api/crisp/rtm', message)
    .then(() => {})
    .catch(error => {
      console.error('❌ Error sending message to Main Backend server:', error.message);
    });
    return;
  }

  if (message.type === 'text') {
    // console.log('📨 Received message:', message);
    const sessionId = message.session_id;

    if (typingTimeout[sessionId]) {
      clearTimeout(typingTimeout[sessionId]);
    }

    if (!messageBuffer[sessionId]) {
      messageBuffer[sessionId] = [];
    }

    messageBuffer[sessionId].push(message.content);

    typingTimeout[sessionId] = setTimeout(() => {
        handleMessagePause(sessionId, message);
    }, PAUSE_THRESHOLD_MS);
  }
});

module.exports = CrispClient;