'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Type, Eye, Volume2, Mic, X, MicOff } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type SpeechResultEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionInstance = InstanceType<SpeechRecognitionConstructor>;

// Extender window para SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const FONT_MIN = 12;
const FONT_MAX = 26;
const FONT_STEP = 2;
const FONT_DEFAULT = 16;
const LS_FONT_KEY = 'wamini-font-size';
const LS_CONTRAST_KEY = 'wamini-high-contrast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitialFontSize(): number {
  if (typeof window === 'undefined') return FONT_DEFAULT;
  const saved = localStorage.getItem(LS_FONT_KEY);
  return saved ? parseInt(saved, 10) : FONT_DEFAULT;
}

function getInitialContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_CONTRAST_KEY) === 'true';
}

function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
  localStorage.setItem(LS_FONT_KEY, String(size));
}

function applyContrast(on: boolean) {
  document.documentElement.classList.toggle('high-contrast', on);
  localStorage.setItem(LS_CONTRAST_KEY, String(on));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // ── Restore persisted settings on mount ──────────────────────────────────
  useEffect(() => {
    const savedSize = getInitialFontSize();
    const savedContrast = getInitialContrast();
    setFontSize(savedSize);
    applyFontSize(savedSize);
    setHighContrast(savedContrast);
    applyContrast(savedContrast);
  }, []);

  // ── High Contrast ────────────────────────────────────────────────────────
  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      applyContrast(next);
      return next;
    });
  }, []);

  // ── Font Size ────────────────────────────────────────────────────────────
  // FIX: usar o valor do callback (prev) — não a closure stale
  const changeFont = useCallback((delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, prev + delta));
      applyFontSize(next);
      return next;
    });
  }, []);

  const resetFont = useCallback(() => {
    setFontSize(FONT_DEFAULT);
    applyFontSize(FONT_DEFAULT);
  }, []);

  // ── Screen Reader ────────────────────────────────────────────────────────
  // FIX: usar delegação de eventos no document em vez de querySelectorAll estático
  useEffect(() => {
    if (!isScreenReaderActive) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const speakText = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      let text =
        target.getAttribute('aria-label') ||
        target.getAttribute('aria-labelledby')
          ? document.getElementById(target.getAttribute('aria-labelledby') || '')?.textContent || ''
          : '';

      if (!text) {
        // Tentar label associada via htmlFor
        if (target.id) {
          const label = document.querySelector(`label[for="${target.id}"]`);
          if (label) text = label.textContent || '';
        }
      }

      if (!text) {
        text =
          (target instanceof HTMLInputElement && target.placeholder) ||
          (target instanceof HTMLSelectElement && target.options[target.selectedIndex]?.text) ||
          target.textContent ||
          '';
      }

      speakText(String(text));
    };

    // Delegação no document — capta todos os elementos incluindo os dinâmicos
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      window.speechSynthesis.cancel();
    };
  }, [isScreenReaderActive]);

  const toggleScreenReader = useCallback(() => {
    // FIX: usar callback para ler o estado mais recente, não a closure stale
    setIsScreenReaderActive((prev) => {
      const next = !prev;
      if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  // ── Voice Commands (SpeechRecognition) ─────────────────────────────────
  // FIX: implementação real com Web Speech Recognition API
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceStatus('Comando de voz não suportado neste browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'pt-PT';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('A ouvir…');
    };

    recognition.onresult = (event: SpeechResultEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setVoiceStatus(`"${transcript}"`);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: Event & { error: string }) => {
      setVoiceStatus(`Erro: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Comandos de voz reconhecidos
  const handleVoiceCommand = (transcript: string) => {
    if (transcript.includes('contraste')) {
      toggleHighContrast();
    } else if (transcript.includes('fonte maior') || transcript.includes('aumentar fonte')) {
      changeFont(FONT_STEP);
    } else if (transcript.includes('fonte menor') || transcript.includes('diminuir fonte')) {
      changeFont(-FONT_STEP);
    } else if (transcript.includes('leitor')) {
      setIsScreenReaderActive((prev) => !prev);
    } else if (transcript.includes('fechar')) {
      setIsOpen(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="gradient-wamini text-black p-4 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 animate-pulse-wamini"
        aria-label="Opções de acessibilidade"
        aria-expanded={isOpen}
      >
        <Eye size={26} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Painel de acessibilidade"
          className="absolute bottom-20 right-0 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-80 space-y-5 animate-fade-in-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl text-gray-900">Acessibilidade</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar painel"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* ── High Contrast ── */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-medium text-gray-700">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Eye size={20} className="text-gray-600" />
              </div>
              Alto Contraste
            </span>
            <button
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              aria-label="Alternar alto contraste"
              className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 ${
                highContrast ? 'gradient-wamini' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  highContrast ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* ── Font Size ── */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-medium text-gray-700">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Type size={20} className="text-gray-600" />
              </div>
              <span>
                Fonte
                <span className="ml-1 text-xs text-gray-400 font-normal">({fontSize}px)</span>
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeFont(-FONT_STEP)}
                disabled={fontSize <= FONT_MIN}
                aria-label="Diminuir tamanho da fonte"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors text-sm"
              >
                A−
              </button>
              <button
                onClick={resetFont}
                aria-label="Repor tamanho da fonte"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold"
                title="Repor"
              >
                ↺
              </button>
              <button
                onClick={() => changeFont(FONT_STEP)}
                disabled={fontSize >= FONT_MAX}
                aria-label="Aumentar tamanho da fonte"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors text-sm"
              >
                A+
              </button>
            </div>
          </div>

          {/* ── Screen Reader ── */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-medium text-gray-700">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Volume2 size={20} className="text-gray-600" />
              </div>
              Leitor de Tela
            </span>
            <button
              onClick={toggleScreenReader}
              aria-pressed={isScreenReaderActive}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                isScreenReaderActive
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {isScreenReaderActive ? 'Desativar' : 'Ativar'}
            </button>
          </div>

          {/* ── Voice Command ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 font-medium text-gray-700">
                <div className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {isListening
                    ? <MicOff size={20} className="text-red-500" />
                    : <Mic size={20} className="text-gray-600" />
                  }
                </div>
                Comando de Voz
              </span>
              <button
                onClick={toggleListening}
                aria-pressed={isListening}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {isListening ? 'Parar' : 'Ativar'}
              </button>
            </div>

            {/* Voice feedback */}
            {voiceStatus && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                {voiceStatus}
              </p>
            )}

            {/* Voice commands hint */}
            {isListening && (
              <div className="text-xs text-gray-400 space-y-0.5 px-1">
                <p>Diga: <strong className="text-gray-600">"contraste"</strong>, <strong className="text-gray-600">"fonte maior"</strong>, <strong className="text-gray-600">"fonte menor"</strong>, <strong className="text-gray-600">"leitor"</strong>, <strong className="text-gray-600">"fechar"</strong></p>
              </div>
            )}
          </div>

          {/* Divider + screen reader note */}
          {isScreenReaderActive && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
              ✓ Leitor activo — foque em qualquer elemento para ouvir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
