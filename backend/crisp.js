require('dotenv').config();
const { Crisp } = require('crisp-api');
const { createClient } = require('./customRequest');

const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'http://localhost:3001';
const mainClient = createClient(MAIN_BACKEND_URL);

// Create the Crisp client (it lets you access both the REST API and RTM events)
const CrispClient = new Crisp();

// Configure your Crisp authentication tokens ('plugin' token)
const CRISP_IDENTIFIER = process.env.CRISP_IDENTIFIER;
const CRISP_KEY = process.env.CRISP_KEY;

if (!CRISP_IDENTIFIER || !CRISP_KEY) {
  console.error('❌ CRISP_IDENTIFIER and CRISP_KEY must be set in environment variables');
  process.exit(1);
}

CrispClient.authenticateTier('plugin', CRISP_IDENTIFIER, CRISP_KEY);

// Set current RTM mode to WebSockets
CrispClient.setRtmMode(Crisp.RTM_MODES.WebSockets);

// Message event handlers
CrispClient.on('message:send', (message) => {
  console.log('📨 Received message:', message);
  
  // Filter on text messages
  if (message.type === 'text') {
    // Send message to Main Backend server
    mainClient.post('/api/crisp/rtm', message)
      .then(result => {})
      .catch(error => {
        console.error('❌ Error sending message to Main Backend server:', error.message);
      });
  }
});

module.exports = CrispClient;