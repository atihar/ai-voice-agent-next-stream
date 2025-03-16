// app/components/VoiceChat.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import VoiceSVGComponent from './voiceIcon';
import AudioLoader from './AudioLoader';

export default function VoiceChat() {
  // Generate a session ID once when the component mounts.
  const [sessionId] = useState(uuidv4());
  // Conversation history: array of { role: 'user'|'assistant', content: string }
  const [conversation, setConversation] = useState([]);
  // We'll also keep a ref to store the current conversation immediately.
  const conversationRef = useRef([]);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  // When avdMode is true, auto-reactivation is enabled.
  const [avdMode, setAvdMode] = useState(false);
  const avdModeRef = useRef(avdMode);
  useEffect(() => {
    avdModeRef.current = avdMode;
  }, [avdMode]);

  const pendingTextRef = useRef(''); // Buffer for accumulating text chunks
  const speakTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const [callActive, setCallActive] = useState(false);

  // Stop any ongoing speech synthesis and clear pending buffered speech.
  const stopReading = () => {
    window.speechSynthesis.cancel();
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    pendingTextRef.current = '';
  };

  // End the call by stopping recognition, speech synthesis and resetting states.
  const endCall = () => {
    console.log('Ending call.');
    stopRecognition();
    stopReading();
    setCallActive(false);
    // Optionally reset conversation or show a "Call ended" message.
    setTranscript('');
    setAvdMode(false)
    // You might choose to clear conversation history or leave it for later reference.
    // setConversation([]);
  };

  // Combine conversation history into a single prompt string.
  const getConversationPrompt = (conv) => {
    // Optionally limit to the last N messages.
    const recent = conv.slice(-14);
    return recent
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  };

  // Start voice recognition using the Web Speech API.
  const startVoiceInput = () => {
    stopReading(); // Stop any ongoing speech output.
    setCallActive(true); // Mark the call as active

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition.');
      return;
    }
    stopRecognition(); // Ensure no duplicate instance.

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = avdMode;

    recognition.onresult = (event) => {
      const speechResult = event.results[event.resultIndex][0].transcript;
      setTranscript(speechResult);
      console.log('Voice Input:', speechResult);
      // Build the new conversation history.
      const newConversation = [...conversationRef.current, { role: 'system', content: `You are erica. Helpful customer support assistant.
        You are working for Doctor Gonzales who is a surgent. If customer wants to do a booking, ask their email and when they want to book. If you get their
        email ask about when they want to book. If you have their email and booking date and time , them their booking has been confirmed and they will be notified via email. Don't reply to anything else. ` },
    { role: 'assistant', content: speechResult }];
      conversationRef.current = newConversation;
      setConversation(newConversation);
      // Call ChatGPT using the updated conversation.
      callChatGPT(newConversation);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      // In AVD mode, auto-restart is handled in speakText's onend callback.
    };

    recognition.start();
    console.log('Recognition started in', avdMode ? 'AVD mode' : 'Push-to-talk mode');
  };

  // Stop any active recognition instance.
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      console.log('Recognition stopped.');
    }
  };

  // Toggle between push-to-talk and AVD mode.
  const toggleMode = () => {
    stopRecognition();
    setAvdMode((prev) => {
      const newMode = !prev;
      console.log('Switched mode to', newMode ? 'AVD mode' : 'Push-to-talk');
      return newMode;
    });
    setTranscript('');
  };

  // Call the ChatGPT API via a Next.js API route.
  // We build a prompt using a system prompt and the given conversation array.
  const callChatGPT = async (convHistory) => {
    try {
      const systemPrompt = "You are a support agent named Erica. Answer like a human in a natural way. Keep it short. Use 1 to 3 sentences in most cases.";
      const conversationPrompt = getConversationPrompt(convHistory);
      const combinedInput = `${systemPrompt}\n${conversationPrompt}\nAssistant:`;
      
      const response = await fetch('/api/chatgpt/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the combined input for context.
        body: JSON.stringify({ sessionId, input: combinedInput }),
      });
      if (!response.body) {
        console.error('No response body');
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';
      let fullResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.slice('data: '.length).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const eventData = JSON.parse(dataStr);
              if (eventData.type === 'response.output_text.delta') {
                const delta = eventData.delta;
                fullResponse += delta;
                setResponseText(fullResponse);
                pendingTextRef.current += delta;
                scheduleBufferedSpeech();
              }
            } catch (err) {
              console.error('Error parsing SSE JSON:', err, dataStr);
            }
          }
        }
      }
      flushBufferedSpeech(true);
      // Append the assistant's reply to conversation history.
      const newConv = [...conversationRef.current, { role: 'assistant', content: fullResponse }];
      conversationRef.current = newConv;
      setConversation(newConv);
    } catch (error) {
      console.error('Error streaming ChatGPT response:', error);
    }
  };

  // Schedule buffered speech output (debounced).
  const scheduleBufferedSpeech = () => {
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    speakTimeoutRef.current = setTimeout(() => flushBufferedSpeech(false), 500);
  };

  // Flush the buffered text and speak it.
  const flushBufferedSpeech = (isFinal) => {
    const textToSpeak = pendingTextRef.current.trim();
    if (textToSpeak) {
      speakText(textToSpeak, isFinal);
      pendingTextRef.current = '';
    } else if (isFinal && avdModeRef.current) {
      speakText('', true);
    }
  };

  /**
   * Use SpeechSynthesis API to speak text.
   * If isFinal is true and we're in AVD mode, auto-restart voice input.
   */
  const speakText = (text, isFinal = false) => {
    if (!text && !isFinal) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (isFinal && avdModeRef.current) {
      utterance.onend = () => {
        setTimeout(() => {
          console.log('Auto-restarting voice input in AVD mode.');
          startVoiceInput();
        }, 2000);
      };
    }
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-screen-sm mx-auto relative">
      <AudioLoader />
      <button
        onClick={() => {
          // Stop any ongoing reading before starting voice input.
          stopReading();
          startVoiceInput();
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex font-medium items-center space-x-1.5 justify-center bg-zinc-50/80 cursor-pointer rounded-full pl-2 pr-3 py-1.5"
      >
        <span className="bg-zinc-800 rounded-full p-2">
          <VoiceSVGComponent width="20px" height="20px" />
        </span>
        <span>Call AI agent</span>
      </button>
      <button
        onClick={toggleMode}
        className="border border-zinc-900 text-sm fixed bottom-5 right-5 flex font-medium items-center space-x-1.5 justify-center cursor-pointer rounded-full px-3 py-1"
      >
        <div className={`flex justify-center items-center px-3 py-1 ${!avdMode ? 'bg-zinc-900/80 text-zinc-50 rounded-full' : 'border-zinc-100 text-black'}`}>
          Push-to-Talk
        </div>
        <div className={`flex justify-center items-center px-3 py-1 ${avdMode ? 'bg-zinc-900/80 text-zinc-50 rounded-full' : 'border-zinc-100 text-black rounded-full'}`}>
          AVD Mode
        </div>
      </button>
      {avdMode && <button
        onClick={endCall}
        className="border border-red-600 text-sm fixed bottom-5 left-1/2 transform -translate-x-1/2 flex font-medium items-center space-x-1.5 justify-center cursor-pointer rounded-full px-3 py-1 text-red-600"
      >
        End Call
      </button>}
      <p className="text-xs text-zinc-400 text-center mt-3">
        In development. Calls are 50% off for first 3 agencies. Remember to visit our privacy policy <br /> before sharing any personal data.
      </p>
      {/* Optional debug info:
      <p><strong>Session ID:</strong> {sessionId}</p>
      <p><strong>Conversation History:</strong> {JSON.stringify(conversation, null, 2)}</p>
      <p><strong>Your input:</strong> {transcript}</p>
      <p><strong>ChatGPT response:</strong> {responseText}</p> */}
    </div>
  );
}
