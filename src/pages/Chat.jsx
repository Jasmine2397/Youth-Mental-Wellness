import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { Bot, Sparkles, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

const SYSTEM_PROMPT = `You are a gentle, empathetic AI companion for young people's mental wellness. Your role is to:

1. ALWAYS be warm, validating, and non-judgmental
2. Never moralize or lecture
3. Normalize emotions - it's okay to feel confused, sad, or overwhelmed
4. Use reflective listening - acknowledge what they're feeling
5. Ask gentle, open-ended questions
6. Never diagnose or prescribe
7. If they mention self-harm, suicidal thoughts, or severe distress:
   - Stay calm and supportive
   - Gently acknowledge their pain
   - Softly encourage talking to a trusted person or professional
   - NEVER panic them or say alarming things
8. Keep responses conversational and human-like
9. Use simple, relatable language
10. Sometimes it's okay to just be present without solving anything

Remember: You're here to listen and support, not to fix. Sometimes people just need to be heard.`;

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisHelp, setShowCrisisHelp] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi there 💫 I'm here whenever you're ready to talk. There's no pressure to share anything specific – we can just take this at your pace. How are you feeling right now?"
      }]);
    }
  }, []);

  const detectCrisis = (text) => {
    const crisisKeywords = [
      'kill myself', 'suicide', 'end my life', 'want to die', 
      'self harm', 'hurt myself', 'cutting', 'worthless',
      "can't go on", "don't want to live", 'no reason to live'
    ];
    return crisisKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  };

  const handleSend = async (content) => {
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Check for crisis language
    if (detectCrisis(content)) {
      setShowCrisisHelp(true);
    }

    const conversationHistory = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n');

    const prompt = `${SYSTEM_PROMPT}

Previous conversation:
${conversationHistory}

User: ${content}

Respond with empathy and warmth. Keep your response natural and conversational.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: null
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-violet-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Home')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-800">Your Companion</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-500">Here for you</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-teal-50 rounded-full">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-xs font-medium text-teal-700">AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Help Banner */}
      <AnimatePresence>
        {showCrisisHelp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-6 pt-4"
          >
            <Alert className="bg-rose-50 border-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <AlertDescription className="text-rose-700">
                <p className="font-medium mb-2">You're not alone in this 💙</p>
                <p className="text-sm mb-3">
                  If you're going through a really difficult time, talking to someone who can help might make things feel a bit lighter.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-rose-200 text-rose-700 hover:bg-rose-100"
                    onClick={() => window.open('tel:988', '_blank')}
                  >
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    Crisis Line: 988
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() => setShowCrisisHelp(false)}
                  >
                    I'm okay for now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6 pb-32">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <ChatMessage 
                key="typing" 
                message={{ role: 'assistant', content: '' }} 
                isTyping 
              />
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-6">
          <ChatInput 
            onSend={handleSend} 
            isLoading={isLoading}
            placeholder="Share what's on your mind..."
          />
        </div>
      </div>
    </div>
  );
}