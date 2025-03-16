# VoiceChat AI Agent

VoiceChat AI Agent is an interactive, voice-enabled support agent designed to provide natural, context-aware customer support. Built using Next.js and integrated with OpenAI's GPT-based streaming API, this project leverages the Web Speech API for voice recognition and speech synthesis. It supports both push-to-talk and continuous (AVD) modes, maintains conversation history, and simulates a call experience with an "End Call" button.

## Features

- **Voice Recognition:**  
  Uses the Web Speech API to capture user queries.
  
- **Streaming AI Responses:**  
  Utilizes OpenAI's GPT streaming API to generate real-time responses.
  
- **Conversation Memory:**  
  Maintains conversation history on the frontend to provide context for multi-turn interactions.
  
- **Dual Mode Operation:**  
  Switch between Push-to-Talk (manual activation) and AVD Mode (continuous, auto-reactivation).
  
- **Call Simulation:**  
  An "End Call" button stops ongoing recognition and speech synthesis, simulating a call end.

- **Session Management:**  
  Each session is assigned a unique ID using UUID to ensure isolated, personalized conversations.

