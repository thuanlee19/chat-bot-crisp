# Chat Bot Team 1 - Backend

A backend service that connects Crisp chat to external backends for intelligent message processing and auto-replies.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Crisp     │─────▶│ Main Backend │─────▶│ External Backend│
│  WebSocket  │      │  (Express)  │      │  (Your API)     │
└─────────────┘      └──────────────┘      └─────────────────┘
                           │                       │
                           │  Response (optional)  │
                           ◀───────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Reply to     │
                    │ Crisp Chat   │
                    └──────────────┘
```

## Components

- **crisp.js**: WebSocket client that connects to Crisp and forwards messages to Main Backend
- **main.js**: Main backend server that receives messages from Crisp and forwards to External Backend
- **crispController.js**: Controller for calling Crisp REST API (sending messages)
- **customRequest.js**: HTTP client for calling External Backend

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend` directory:

```env
PORT=3001
EXTERNAL_BACKEND_URL=http://localhost:8000
EXTERNAL_BACKEND_API=/api/chat
MAIN_BACKEND_URL=http://localhost:3001
CRISP_IDENTIFIER=your-crisp-identifier
CRISP_KEY=your-crisp-key
EXTERNAL_BACKEND_PORT=8000
```

### 3. Run the Services

**Terminal 1 - Main Backend:**
```bash
npm run main:dev
```

**Terminal 2 - Crisp WebSocket:**
```bash
npm run websocket:dev
```

**Terminal 3 - Test External Backend (optional):**
```bash
npm run test-backend:dev
```

## External Backend Integration

### EXTERNAL_BACKEND_URL & EXTERNAL_BACKEND_API

Your external backend receives messages and can send responses back:

- **EXTERNAL_BACKEND_URL**: Base URL of your external API (e.g., `http://localhost:8000`)
- **EXTERNAL_BACKEND_API**: Endpoint path (e.g., `/api/chat`)

### Request to External Backend

When a user sends a message in Crisp, the Main Backend forwards it to your External Backend:

**Endpoint:** `POST {EXTERNAL_BACKEND_URL}{EXTERNAL_BACKEND_API}`

**Payload:**
```json
{
  "content": "User message content",
  "type": "text",
  "website_id": "668435a2-18ec-4b3b-a4c1-5e39c8c40925",
  "session_id": "48136d1f-e53b-481f-af4e-325685e1983a",
  "metadata": {
    // Conversation metadata from Crisp
  }
}
```

### Response from External Backend

To enable auto-reply, your External Backend should return:

```json
{
  "response": "Your bot reply message",
  "status": "success"
}
```

**Example Implementation:**

```javascript
app.post('/api/chat', async (req, res) => {
  const { content, session_id, website_id } = req.body;
  
  // Process the message with your AI/LLM
  const botResponse = await processMessage(content);
  
  // Return response that will be sent to Crisp
  res.json({
    response: botResponse,
    status: 'success'
  });
});
```

## Main Backend API Endpoints

### 1. Receive Messages from Crisp

**Endpoint:** `POST /api/crisp/rtm`

Handles incoming messages from Crisp WebSocket connection.

### 2. Send Message to Crisp

**Endpoint:** `POST /api/crisp/send-message`

Allows external systems to send messages to Crisp conversations.

**cURL Example:**
```bash
curl --location 'http://localhost:3001/api/crisp/send-message' \
--header 'Content-Type: application/json' \
--data '{
    "website_id": "your-website-id",
    "session_id": "your-session-id",
    "message": {
        "content": "Hello from external backend!"
    }
}'
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Message Flow

1. **User sends message in Crisp** → WebSocket receives it
2. **Crisp WebSocket** (`crisp.js`) forwards to **Main Backend** (`main.js`)
3. **Main Backend** calls your **External Backend** with the message
4. **External Backend** processes message and returns response
5. **Main Backend** receives response and sends it back to **Crisp**
6. **User sees reply** in Crisp chat

## Development

### Hot Reload

All services support hot reload with `nodemon`:

```bash
npm run main:dev      # Main Backend with hot reload
npm run websocket:dev # Crisp WebSocket with hot reload
npm run test-backend:dev # Test Backend with hot reload
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Main backend port | `3001` |
| `EXTERNAL_BACKEND_URL` | External backend base URL | `http://localhost:8000` |
| `EXTERNAL_BACKEND_API` | External backend endpoint | `/api/chat` |
| `MAIN_BACKEND_URL` | Main backend URL | `http://localhost:3001` |
| `CRISP_IDENTIFIER` | Crisp plugin identifier | - |
| `CRISP_KEY` | Crisp plugin key | - |
| `EXTERNAL_BACKEND_PORT` | Test backend port | `8000` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run main` | Start Main Backend |
| `npm run main:dev` | Start Main Backend with hot reload |
| `npm run websocket` | Start Crisp WebSocket connection |
| `npm run websocket:dev` | Start Crisp WebSocket with hot reload |


