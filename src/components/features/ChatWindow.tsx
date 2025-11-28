'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'António Guerra', text: 'Bom dia, ja despachei o produto!', timestamp: new Date(), isMe: false },
    { id: '2', sender: 'Me', text: 'Ok, obrigado!', timestamp: new Date(), isMe: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: 'Me',
      text: newMessage,
      timestamp: new Date(),
      isMe: true,
    }]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-lg">João João</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${msg.isMe ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>
              {!msg.isMe && <p className="text-xs font-bold mb-1">{msg.sender}</p>}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mensagem"
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-primary"
          />
          <button onClick={handleSend} className="p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
