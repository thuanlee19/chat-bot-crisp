const axios = require('axios');

const CRISP_API_BASE_URL = 'https://api.crisp.chat/v1';
const CRISP_IDENTIFIER = process.env.CRISP_IDENTIFIER;
const CRISP_KEY = process.env.CRISP_KEY;

/**
 * Get conversation metadata from Crisp API
 * @param {string} websiteId - Website ID
 * @param {string} sessionId - Session ID
 * @returns {Promise} - Conversation metadata
 */
async function getConversationMetadata(websiteId, sessionId) {
  try {
    const auth = Buffer.from(`${CRISP_IDENTIFIER}:${CRISP_KEY}`).toString('base64');
    
    const response = await axios.get(
      `${CRISP_API_BASE_URL}/website/${websiteId}/conversation/${sessionId}/meta`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Crisp-Tier': 'plugin',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error calling Crisp API:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get messages in conversation from Crisp API
 * @param {string} websiteId - Website ID
 * @param {string} sessionId - Session ID
 * @returns {Promise} - Conversation messages
 */
async function getMessagesInConversation(websiteId, sessionId, timestamp) {
  try {
    const auth = Buffer.from(`${CRISP_IDENTIFIER}:${CRISP_KEY}`).toString('base64');
    console.log(timestamp);
    
    const response = await axios.get(
      `${CRISP_API_BASE_URL}/website/${websiteId}/conversation/${sessionId}/messages/?timestamp_before=${timestamp}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Crisp-Tier': 'plugin',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    return {
      success: true,
      data: {
        ...response.data,
        total: response.data?.data?.length ?? 0
      },
    };
  } catch (error) {
    console.log(error);
    console.error('❌ Error getting messages from Crisp API:', error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

/**
 * Send message to Crisp conversation
 * @param {string} websiteId - Website ID
 * @param {string} sessionId - Session ID
 * @param {object} messageData - Message data (type, from, origin, content)
 * @returns {Promise} - Send result
 */
async function sendMessageToConversation(websiteId, sessionId, messageData) {
  try {
    const auth = Buffer.from(`${CRISP_IDENTIFIER}:${CRISP_KEY}`).toString('base64');
    
    const response = await axios.post(
      `${CRISP_API_BASE_URL}/website/${websiteId}/conversation/${sessionId}/message`,
      messageData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Crisp-Tier': 'plugin',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error sending message to Crisp:', error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

module.exports = {
  getConversationMetadata,
  getMessagesInConversation,
  sendMessageToConversation
};

