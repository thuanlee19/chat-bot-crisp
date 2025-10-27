require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.EXTERNAL_BACKEND_PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Test External Backend Server',
    version: '1.0.0',
    status: 'running',
    port: PORT
  });
});

// Receive chat messages from main backend
app.post('/api/chat', async (req, res) => {
  try {
    const payload = req.body;
    console.log('📨 Received message from main backend:', payload);
    
    // Extract message content
    const content = payload.content;
    const sessionId = payload.session_id;
    const websiteId = payload.website_id;
    
    console.log(`💬 Message: "${content}"`);
    console.log(`🔑 Session: ${sessionId}`);
    console.log(`🌐 Website: ${websiteId}`);
    
    // Process the message (you can add your logic here)
    // For testing, we'll just echo back a response
    const response = {
      success: true,
      message: 'Message processed successfully',
      timestamp: new Date().toISOString(),
      // Uncomment below to send an auto-reply to Crisp
      // response: `I received your message: "${content}". How can I help you?`
    };
    
    console.log('✅ Sending response to main backend');
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
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
  console.log(`🚀 Test External Backend Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
});

module.exports = app;

