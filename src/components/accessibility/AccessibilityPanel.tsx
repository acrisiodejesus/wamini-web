'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Type, Eye, Volume2, Mic } from 'lucide-react';

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isListening, setIsListening] = useState(false);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  const togglePanel = () => setIsOpen(!isOpen);

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast');
  };

  const increaseFont = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
    document.documentElement.style.fontSize = `${fontSize + 2}px`;
  };

  const decreaseFont = () => {
    setFontSize((prev) => Math.max(prev - 2, 12));
    document.documentElement.style.fontSize = `${fontSize - 2}px`;
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log('Started listening...');
    } else {
      console.log('Stopped listening.');
    }
  };

  const toggleScreenReader = () => {
    setIsScreenReaderActive(!isScreenReaderActive);
    if (!isScreenReaderActive) {
      console.log('Screen reader activated...');
    } else {
      console.log('Screen reader deactivated.');
      // Cancel any ongoing speech
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Screen reader functionality
  useEffect(() => {
    if (!isScreenReaderActive || typeof window === 'undefined') return;

    // Check for Speech Synthesis API support
    if (!window.speechSynthesis) {
      console.warn('Speech Synthesis API not supported in this browser');
      return;
    }

    const speakText = (text: string) => {
      if (!text || text.trim() === '') return;
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-PT'; // Portuguese language
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    };

    const handleElementInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Get text to speak based on element type
      let textToSpeak = '';

      // Priority: aria-label > text content > placeholder > alt text
      if (target.getAttribute('aria-label')) {
        textToSpeak = target.getAttribute('aria-label') || '';
      } else if (target.textContent && target.textContent.trim()) {
        textToSpeak = target.textContent.trim();
      } else if (target instanceof HTMLInputElement && target.placeholder) {
        textToSpeak = target.placeholder;
      } else if (target instanceof HTMLImageElement && target.alt) {
        textToSpeak = target.alt;
      }

      if (textToSpeak) {
        speakText(textToSpeak);
      }
    };

    // Add event listeners to interactive elements
    const interactiveSelector = 'button, a, input, select, textarea, [role="button"], [tabindex]';
    const elements = document.querySelectorAll(interactiveSelector);
    
    elements.forEach(element => {
      element.addEventListener('mouseover', handleElementInteraction);
      element.addEventListener('focus', handleElementInteraction);
    });

    // Cleanup function
    return () => {
      elements.forEach(element => {
        element.removeEventListener('mouseover', handleElementInteraction);
        element.removeEventListener('focus', handleElementInteraction);
      });
      
      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isScreenReaderActive]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={togglePanel}
        className="gradient-wamini text-black p-4 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
        aria-label="Accessibility Options"
      >
        <Eye size={28} />
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-80 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-black text-xl mb-4 text-gray-900 dark:text-white">Acessibilidade</h3>
          
          <div className="flex items-center justify-between group">
            <span className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-yellow-100 dark:group-hover:bg-gray-600 transition-colors">
                <Eye size={24} className="text-gray-600 dark:text-gray-300" />
              </div>
              Alto Contraste
            </span>
            <button
              onClick={toggleHighContrast}
              className={`w-12 h-6 rounded-full transition-colors ${highContrast ? 'gradient-wamini' : 'bg-gray-300'}`}
              aria-pressed={highContrast}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${highContrast ? 'translate-x-7' : 'translate-x-1'} mt-1 shadow-md border border-gray-400`} />
            </button>
          </div>

          <div className="flex items-center justify-between group">
            <span className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-yellow-100 dark:group-hover:bg-gray-600 transition-colors">
                <Type size={24} className="text-gray-600 dark:text-gray-300" />
              </div>
              Tamanho da Fonte
            </span>
            <div className="flex gap-2">
              <button onClick={decreaseFont} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" aria-label="Decrease font size">A-</button>
              <button onClick={increaseFont} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" aria-label="Increase font size">A+</button>
            </div>
          </div>

          <div className="flex items-center justify-between group">
            <span className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-yellow-100 dark:group-hover:bg-gray-600 transition-colors">
                <Volume2 size={24} className="text-gray-600 dark:text-gray-300" />
              </div>
              Leitor de Tela
            </span>
            <button 
              onClick={toggleScreenReader}
              className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${
                isScreenReaderActive 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isScreenReaderActive ? 'Desativar' : 'Ativar'}
            </button>
          </div>

          <div className="flex items-center justify-between group">
            <span className="flex items-center gap-3 font-medium text-gray-700 dark:text-gray-200">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-yellow-100 dark:group-hover:bg-gray-600 transition-colors">
                <Mic size={24} className="text-gray-600 dark:text-gray-300" />
              </div>
              Comando de Voz
            </span>
            <button 
              onClick={toggleListening}
              className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isListening ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
