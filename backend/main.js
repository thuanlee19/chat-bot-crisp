require('dotenv').config();
const express = require('express');
const { getConversationMetadata, getMessagesInConversation, sendMessageToConversation } = require('./crispController');
const { createClient } = require('./customRequest');

const app = express();
const PORT = process.env.PORT || 3001;
const EXTERNAL_BACKEND_URL = process.env.EXTERNAL_BACKEND_URL;
const EXTERNAL_BACKEND_API = process.env.EXTERNAL_BACKEND_API;

const externalClient = createClient(EXTERNAL_BACKEND_URL);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Main Backend Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Receive messages from Crisp
app.post('/api/crisp/rtm', async (req, res) => {
  try {
    const message = req.body;
    
    // Extract website_id and session_id from message
    const websiteId = message.website_id;
    const sessionId = message.session_id;
    
    let metadata = null;
    
    if (websiteId && sessionId) {
      // Call Crisp API to get conversation metadata
      metadata = await getConversationMetadata(websiteId, sessionId);
    }

    // Send message to external backend
    const externalPayload = {
      content: message.content,
      type: message.type,
      website_id: websiteId,
      session_id: sessionId,
      localUserId: metadata?.data?.data?.data['local-user-id'] ?? null,
      localUserEmail: metadata?.data?.data?.data['user-email'] ?? null,
      userData: message.user,
      fingerprint: message.fingerprint
    };
    
    let externalResult = null;
    
    try {
      console.log('Calling external backend with payload:', externalPayload);
      externalResult = await externalClient.post(`${EXTERNAL_BACKEND_API}`, externalPayload);
      if (externalResult.success) {
        // Optional: Send response back to Crisp conversation
        if (externalResult.data?.response) {
          const replyMessage = {
            type: 'text',
            from: 'operator',
            origin: 'chat',
            content: externalResult.data.response
          };
          
          await sendMessageToConversation(websiteId, sessionId, replyMessage);
        }
      } else {
        console.error('❌ External backend error:', externalResult.error);
      }
    } catch (error) {
      console.error('❌ Error calling external backend:', error.message);
      externalResult = { success: false, error: error.message };
    }
    
    res.json({
      message: 'Message received and processed',
      timestamp: new Date().toISOString(),
      metadata: metadata?.data,
      externalBackend: externalResult?.success || false
    });
  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({
      error: 'Failed to process message',
      timestamp: new Date().toISOString()
    });
  }
});

// Send message to Crisp conversation (for external API)
app.post('/api/crisp/send-message', async (req, res) => {
  try {
    const { website_id, session_id, message } = req.body;
    
    if (!website_id || !session_id || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['website_id', 'session_id', 'message']
      });
    }
    
    // Prepare message data for Crisp
    const messageData = {
      type: message.type || 'text',
      from: message.from || 'operator',
      origin: message.origin || 'chat',
      content: message.content
    };
    
    console.log(`📤 Sending message to session ${session_id}`);
    
    // Send message to Crisp
    const result = await sendMessageToConversation(website_id, session_id, messageData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(result.status || 500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
});

// Get conversation metadata by websiteId and sessionId
app.get('/api/crisp/conversation/metadata', async (req, res) => {
  try {
    const { websiteId, sessionId } = req.query;
    
    if (!websiteId || !sessionId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['websiteId', 'sessionId']
      });
    }
    
    console.log(`📋 Getting conversation metadata for website ${websiteId}, session ${sessionId}`);
    
    // Call getConversationMetadata function
    const result = await getConversationMetadata(websiteId, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get conversation metadata',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error getting conversation metadata:', error);
    res.status(500).json({
      error: 'Failed to get conversation metadata',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all messages in conversation by websiteId and sessionId
app.get('/api/crisp/conversation/messages', async (req, res) => {
  try {
    const { websiteId, sessionId, timestamp } = req.query;
    
    if (!websiteId || !sessionId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['websiteId', 'sessionId']
      });
    }
    
    console.log(`📨 Getting messages for website ${websiteId}, session ${sessionId}, timestamp ${timestamp}`);
    
    // Call getMessagesInConversation function
    const result = await getMessagesInConversation(websiteId, sessionId, timestamp);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(result.status || 500).json({
        success: false,
        error: result.error || 'Failed to get conversation messages',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error getting conversation messages:', error);
    res.status(500).json({
      error: 'Failed to get conversation messages',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Main Backend Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
});

module.exports = app;

