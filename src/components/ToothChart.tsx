'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, Clock, RotateCcw, Wand2, Sparkles, ChevronRight, ChevronLeft, Check, CheckCircle2, Mic, MicOff, Volume2, Baby, UserCheck } from 'lucide-react';

export type ToothCondition = 'healthy' | 'caries' | 'filling' | 'crown' | 'missing';

export interface ToothRecordItem {
  tooth_number: string;
  condition: ToothCondition;
  surfaces?: string[];
  notes?: string;
}

export interface AIFindingItem {
  id?: string;
  imaging_asset_id?: string;
  tooth_number: string;
  finding_type: string;
  confidence_score: number | string;
  description: string;
  generated_at?: string;
}

interface ToothChartProps {
  records: Record<string, ToothRecordItem>;
  selectedTooth: string | null;
  onSelectTooth: (toothNumber: string) => void;
  aiFindings?: AIFindingItem[];
  readOnly?: boolean;
  onQuickConditionChange?: (toothNumber: string, condition: ToothCondition) => void;
  onBatchConditionChange?: (updates: Array<{ tooth_number: string; condition: ToothCondition }>) => void;
  onAutoGeneratePlan?: () => void;
  isAutoPlanLoading?: boolean;
}

// FDI 32 adult teeth numbering
export const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28'
];

export const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

export const ALL_TEETH_ORDER = [
  ...UPPER_TEETH,
  ...LOWER_TEETH
];

// FDI 20 pediatric (deciduous/milk) teeth numbering
export const PEDIATRIC_UPPER_TEETH = [
  '55', '54', '53', '52', '51',
  '61', '62', '63', '64', '65'
];

export const PEDIATRIC_LOWER_TEETH = [
  '85', '84', '83', '82', '81',
  '71', '72', '73', '74', '75'
];

export const ALL_PEDIATRIC_TEETH_ORDER = [
  ...PEDIATRIC_UPPER_TEETH,
  ...PEDIATRIC_LOWER_TEETH
];

const CONDITION_COLORS: Record<ToothCondition, { fill: string; stroke: string; label: string }> = {
  healthy: { fill: 'var(--color-healthy-bg, #ecfdf5)', stroke: 'var(--color-healthy, #10b981)', label: 'Healthy' },
  caries: { fill: 'var(--color-caries-bg, #fffbeb)', stroke: 'var(--color-caries, #f59e0b)', label: 'Caries' },
  filling: { fill: 'var(--color-filling-bg, #eff6ff)', stroke: 'var(--color-filling, #3b82f6)', label: 'Filling' },
  crown: { fill: 'var(--color-crown-bg, #f5f3ff)', stroke: 'var(--color-crown, #8b5cf6)', label: 'Crown' },
  missing: { fill: 'var(--color-missing-bg, #f1f5f9)', stroke: 'var(--color-missing, #94a3b8)', label: 'Missing' },
};

export default function ToothChart({
  records,
  selectedTooth,
  onSelectTooth,
  aiFindings = [],
  readOnly = false,
  onQuickConditionChange,
  onBatchConditionChange,
  onAutoGeneratePlan,
  isAutoPlanLoading = false,
}: ToothChartProps) {
  // Rapid 45-second charting mode states
  const [rapidMode, setRapidMode] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [internalActiveTooth, setInternalActiveTooth] = useState<string>('18');

  // Dentition mode: adult vs pediatric deciduous
  const [dentitionMode, setDentitionMode] = useState<'adult' | 'pediatric'>('adult');

  // Hands-free Voice Assistant states
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');

  // Active tooth list based on dentition mode
  const activeTeethOrder = dentitionMode === 'adult' ? ALL_TEETH_ORDER : ALL_PEDIATRIC_TEETH_ORDER;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (rapidMode && isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rapidMode, isTimerRunning]);

  const toggleRapidMode = () => {
    if (!rapidMode) {
      setRapidMode(true);
      setIsTimerRunning(true);
      setInternalActiveTooth(selectedTooth || (dentitionMode === 'adult' ? '18' : '55'));
      if (selectedTooth) {
        onSelectTooth(''); // close slide drawer so it doesn't block charting
      }
    } else {
      setRapidMode(false);
      setIsTimerRunning(false);
    }
  };

  const resetTimer = () => {
    setSecondsElapsed(0);
  };

  // Move tooth in sequence
  const advanceTooth = useCallback((direction: 1 | -1) => {
    const currentTooth = rapidMode ? internalActiveTooth : (selectedTooth || (dentitionMode === 'adult' ? '18' : '55'));
    const currentIndex = currentTooth ? activeTeethOrder.indexOf(currentTooth) : -1;
    let nextIndex = currentIndex + direction;
    if (nextIndex >= activeTeethOrder.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = activeTeethOrder.length - 1;
    const nextTooth = activeTeethOrder[nextIndex];
    if (rapidMode) {
      setInternalActiveTooth(nextTooth);
    } else {
      onSelectTooth(nextTooth);
    }
  }, [rapidMode, internalActiveTooth, selectedTooth, onSelectTooth, activeTeethOrder, dentitionMode]);

  // Apply quick condition and automatically advance
  const applyQuickCondition = useCallback((condition: ToothCondition) => {
    const targetTooth = rapidMode ? internalActiveTooth : (selectedTooth || (dentitionMode === 'adult' ? '18' : '55'));
    if (onQuickConditionChange) {
      onQuickConditionChange(targetTooth, condition);
    }
    if (rapidMode) {
      // Auto advance to next tooth for 45s rapid pace!
      advanceTooth(1);
    }
  }, [rapidMode, internalActiveTooth, selectedTooth, onQuickConditionChange, advanceTooth, dentitionMode]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Hotkeys active when rapidMode is on, or when a tooth is explicitly selected
      if (!rapidMode && !selectedTooth) return;

      const key = e.key.toLowerCase();

      if (key === 'c') {
        e.preventDefault();
        applyQuickCondition('caries');
      } else if (key === 'f') {
        e.preventDefault();
        applyQuickCondition('filling');
      } else if (key === 'r') {
        e.preventDefault();
        applyQuickCondition('crown');
      } else if (key === 'h') {
        e.preventDefault();
        applyQuickCondition('healthy');
      } else if (key === 'm') {
        e.preventDefault();
        applyQuickCondition('missing');
      } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        advanceTooth(1);
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        advanceTooth(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, rapidMode, selectedTooth, applyQuickCondition, advanceTooth]);

  // Calculate pathology statistics
  const defectStats = useMemo(() => {
    let cariesCount = 0;
    let crownCount = 0;
    let missingCount = 0;
    let filledCount = 0;

    Object.values(records).forEach((r) => {
      if (r.condition === 'caries') cariesCount++;
      else if (r.condition === 'crown') crownCount++;
      else if (r.condition === 'missing') missingCount++;
      else if (r.condition === 'filling') filledCount++;
    });

    return {
      cariesCount,
      crownCount,
      missingCount,
      filledCount,
      totalDefects: cariesCount + crownCount + missingCount,
    };
  }, [records]);

  // Macro Preset actions
  const applyMacro = (preset: 'upper_molars' | 'lower_molars' | 'anterior_cosmetic' | 'full_healthy') => {
    if (!onBatchConditionChange) return;

    if (preset === 'upper_molars') {
      const teeth = ['18', '17', '16', '26', '27', '28'];
      onBatchConditionChange(teeth.map((t) => ({ tooth_number: t, condition: 'caries' })));
    } else if (preset === 'lower_molars') {
      const teeth = ['48', '47', '46', '36', '37', '38'];
      onBatchConditionChange(teeth.map((t) => ({ tooth_number: t, condition: 'crown' })));
    } else if (preset === 'anterior_cosmetic') {
      const teeth = ['13', '12', '11', '21', '22', '23'];
      onBatchConditionChange(teeth.map((t) => ({ tooth_number: t, condition: 'filling' })));
    } else if (preset === 'full_healthy') {
      onBatchConditionChange(ALL_TEETH_ORDER.map((t) => ({ tooth_number: t, condition: 'healthy' })));
    }
  };

  // Voice recognition and clinical NLP command parsing
  const handleVoiceCommand = useCallback((cmd: string) => {
    const clean = cmd.toLowerCase().trim();
    setVoiceTranscript(cmd);

    // Check for dentition toggle
    if (clean.includes('pediatric') || clean.includes('milk') || clean.includes('child')) {
      setDentitionMode('pediatric');
      setVoiceFeedback('Switched to Pediatric (Milk Teeth 51-85) Arch');
      return;
    }
    if (clean.includes('adult') || clean.includes('permanent')) {
      setDentitionMode('adult');
      setVoiceFeedback('Switched to Adult Permanent (11-48) Arch');
      return;
    }

    // Check for macros
    if (clean.includes('upper molar')) {
      applyMacro('upper_molars');
      setVoiceFeedback('Macro: Upper Molars Caries Applied');
      return;
    }
    if (clean.includes('lower molar')) {
      applyMacro('lower_molars');
      setVoiceFeedback('Macro: Lower Molars RCT Applied');
      return;
    }
    if (clean.includes('all healthy') || clean.includes('scaled')) {
      applyMacro('full_healthy');
      setVoiceFeedback('Macro: Full Mouth Scaled Applied');
      return;
    }

    // Extract tooth number (e.g. 11-48, 51-85)
    const match = clean.match(/\b([1-8][1-8])\b/);
    const toothNum = match ? match[1] : (rapidMode ? internalActiveTooth : selectedTooth);

    if (toothNum) {
      if (clean.includes('caries') || clean.includes('cavity') || clean.includes('decay')) {
        if (onQuickConditionChange) onQuickConditionChange(toothNum, 'caries');
        setVoiceFeedback(`Tooth #${toothNum} marked as CARIES`);
      } else if (clean.includes('rct') || clean.includes('crown') || clean.includes('root canal')) {
        if (onQuickConditionChange) onQuickConditionChange(toothNum, 'crown');
        setVoiceFeedback(`Tooth #${toothNum} marked as RCT/CROWN`);
      } else if (clean.includes('fill') || clean.includes('restoration') || clean.includes('composite')) {
        if (onQuickConditionChange) onQuickConditionChange(toothNum, 'filling');
        setVoiceFeedback(`Tooth #${toothNum} marked as FILLING`);
      } else if (clean.includes('healthy') || clean.includes('normal')) {
        if (onQuickConditionChange) onQuickConditionChange(toothNum, 'healthy');
        setVoiceFeedback(`Tooth #${toothNum} marked as HEALTHY`);
      } else if (clean.includes('missing') || clean.includes('extracted')) {
        if (onQuickConditionChange) onQuickConditionChange(toothNum, 'missing');
        setVoiceFeedback(`Tooth #${toothNum} marked as MISSING`);
      } else {
        setVoiceFeedback(`Selected Tooth #${toothNum}`);
        if (rapidMode) setInternalActiveTooth(toothNum);
        else onSelectTooth(toothNum);
      }
    } else {
      setVoiceFeedback(`Command not recognized: "${cmd}"`);
    }
  }, [rapidMode, internalActiveTooth, selectedTooth, onQuickConditionChange, onSelectTooth]);

  const toggleVoiceRecognition = () => {
    if (!isVoiceListening) {
      setIsVoiceListening(true);
      setVoiceFeedback('Listening for Dental Commands... (e.g. "Chart 16 Caries")');

      // Check if Web Speech API is supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-IN';
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleVoiceCommand(transcript);
            setIsVoiceListening(false);
          };
          recognition.onerror = () => {
            setIsVoiceListening(false);
          };
          recognition.onend = () => {
            setIsVoiceListening(false);
          };
          recognition.start();
        } catch (e) {
          console.error('Speech recognition error:', e);
        }
      }
    } else {
      setIsVoiceListening(false);
      setVoiceFeedback('Voice recognition paused');
    }
  };

  // Map AI findings by tooth number
  const aiFindingsByTooth = useMemo(() => {
    const map: Record<string, AIFindingItem[]> = {};
    for (const f of aiFindings) {
      if (!map[f.tooth_number]) map[f.tooth_number] = [];
      map[f.tooth_number].push(f);
    }
    return map;
  }, [aiFindings]);

  // Tooth anatomy renderer with surfaces and AI overlay
  const renderTooth = (toothNumber: string, isUpper: boolean) => {
    const record = records[toothNumber];
    const condition: ToothCondition = record?.condition || 'healthy';
    const isSelected = selectedTooth === toothNumber;
    const isMissing = condition === 'missing';
    const colors = CONDITION_COLORS[condition] || CONDITION_COLORS.healthy;
    const toothAiFindings = aiFindingsByTooth[toothNumber] || [];
    const hasAiFinding = toothAiFindings.length > 0;
    
    // Check for discrepancy: AI detected caries/bone_loss but dentist charted healthy
    const hasDiscrepancy = hasAiFinding && condition === 'healthy';

    return (
      <div
        key={toothNumber}
        onClick={() => onSelectTooth(toothNumber)}
        role="button"
        tabIndex={0}
        id={`tooth-${toothNumber}`}
        data-tooth={toothNumber}
        data-condition={condition}
        aria-label={`Tooth ${toothNumber}, Status: ${colors.label}${hasAiFinding ? `, AI Finding: ${toothAiFindings[0].finding_type}` : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectTooth(toothNumber);
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          cursor: readOnly ? 'default' : 'pointer',
          padding: '6px 4px',
          borderRadius: 'var(--radius-md, 8px)',
          background: isSelected ? 'var(--color-accent-subtle, #e0f2fe)' : 'transparent',
          border: isSelected ? '2px solid var(--color-accent, #0284c7)' : '2px solid transparent',
          position: 'relative',
          transition: 'all 0.15s ease',
          userSelect: 'none',
          boxShadow: isSelected ? '0 0 0 3px rgba(2, 132, 199, 0.25)' : 'none',
        }}
      >
        {/* Upper tooth number header */}
        {isUpper && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--color-accent-text, #0369a1)' : 'var(--color-ink-secondary, #64748b)' }}>
            {toothNumber}
          </span>
        )}

        {/* Anatomical Tooth SVG with Surface Segments */}
        <div style={{ position: 'relative', width: '38px', height: '48px' }}>
          <svg
            viewBox="0 0 38 48"
            style={{
              width: '100%',
              height: '100%',
              filter: isSelected ? 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.3))' : 'none',
            }}
          >
            {/* AI Highlight Halo / Glow */}
            {hasAiFinding && (
              <path
                d={
                  isUpper
                    ? "M 10 4 C 10 1, 28 1, 28 4 C 34 14, 36 28, 34 38 C 32 44, 6 44, 4 38 C 2 28, 4 14, 10 4 Z"
                    : "M 4 10 C 6 4, 32 4, 34 10 C 36 20, 34 34, 28 44 C 28 47, 10 47, 10 44 C 4 34, 2 20, 4 10 Z"
                }
                fill="none"
                stroke={hasDiscrepancy ? "#ef4444" : "#f59e0b"}
                strokeWidth="4"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            )}

            {/* Tooth Root & Crown Outline */}
            <path
              d={
                isUpper
                  ? "M 10 4 C 10 1, 28 1, 28 4 C 34 14, 36 28, 34 38 C 32 44, 6 44, 4 38 C 2 28, 4 14, 10 4 Z"
                  : "M 4 10 C 6 4, 32 4, 34 10 C 36 20, 34 34, 28 44 C 28 47, 10 47, 10 44 C 4 34, 2 20, 4 10 Z"
              }
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="2"
            />

            {/* Central Occlusal / Incisal Surface */}
            {!isMissing && (
              <circle
                cx="19"
                cy="24"
                r="7"
                fill={record?.surfaces?.includes('O') ? colors.stroke : '#ffffff'}
                stroke={colors.stroke}
                strokeWidth="1.5"
                opacity={record?.surfaces?.includes('O') ? 0.85 : 0.6}
              />
            )}

            {/* Mesial surface indicator */}
            {record?.surfaces?.includes('M') && (
              <path d="M 5 20 Q 12 24 5 28" stroke={colors.stroke} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Distal surface indicator */}
            {record?.surfaces?.includes('D') && (
              <path d="M 33 20 Q 26 24 33 28" stroke={colors.stroke} strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Missing Tooth 'X' Indicator */}
            {isMissing && (
              <g stroke="var(--color-ink-muted, #64748b)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="12" x2="30" y2="36" />
                <line x1="30" y1="12" x2="8" y2="36" />
              </g>
            )}

            {/* Crown visual rim */}
            {condition === 'crown' && (
              <path
                d={isUpper ? "M 7 36 Q 19 40 31 36" : "M 7 12 Q 19 8 31 12"}
                stroke="var(--color-crown, #8b5cf6)"
                strokeWidth="2"
                fill="none"
              />
            )}
          </svg>

          {/* AI Badge Overlay (Top Right of Tooth) */}
          {hasAiFinding && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                background: hasDiscrepancy ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 800,
                borderRadius: '999px',
                padding: '1px 4px',
                lineHeight: 1.2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                letterSpacing: '-0.02em',
              }}
              title={toothAiFindings.map(f => `${f.finding_type} (${Math.round(Number(f.confidence_score) * 100)}%)`).join(', ')}
            >
              AI
            </div>
          )}
        </div>

        {/* Lower tooth number footer */}
        {!isUpper && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--color-accent-text, #0369a1)' : 'var(--color-ink-secondary, #64748b)' }}>
            {toothNumber}
          </span>
        )}
      </div>
    );
  };

  // Timer pacing styling
  const timerBadgeColor = secondsElapsed < 30 ? '#10b981' : secondsElapsed <= 45 ? '#f59e0b' : '#ef4444';
  const timerStatusLabel = secondsElapsed < 30 ? 'Pacing: Ultra-Rapid' : secondsElapsed <= 45 ? 'Pacing: On Target' : 'Pacing: Detailed Exam';

  return (
    <div className="panel-card" style={{ padding: '1.25rem' }}>
      {/* Header & Rapid Mode Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>FDI 2-Digit Dental Chart</h3>
            {rapidMode && (
              <span style={{
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
              }}>
                ⚡ 45s Rapid Mode Active
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #64748b)', margin: '4px 0 0 0' }}>
            Click teeth or use <strong>[C/F/R/H/M] hotkeys</strong> to chart the entire mouth in under 45 seconds.
          </p>
        </div>

        {/* Rapid Mode Controls & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Dentition Arch Switcher: Adult vs Pediatric Deciduous */}
          <div
            id="dentition-mode-toggle"
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid #cbd5e1',
            }}
          >
            <button
              id="dentition-adult-btn"
              onClick={() => setDentitionMode('adult')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: dentitionMode === 'adult' ? '#0284c7' : 'transparent',
                color: dentitionMode === 'adult' ? '#ffffff' : '#64748b',
              }}
            >
              <UserCheck size={12} />
              <span>Adult (11-48)</span>
            </button>
            <button
              id="dentition-pediatric-btn"
              onClick={() => setDentitionMode('pediatric')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: dentitionMode === 'pediatric' ? '#ec4899' : 'transparent',
                color: dentitionMode === 'pediatric' ? '#ffffff' : '#64748b',
              }}
            >
              <Baby size={12} />
              <span>Pediatric Milk (51-85)</span>
            </button>
          </div>

          {/* Hands-Free Voice Assistant Bar Button */}
          <button
            id="toggle-voice-btn"
            onClick={toggleVoiceRecognition}
            className="btn btn-sm"
            style={{
              background: isVoiceListening ? '#ef4444' : '#f8fafc',
              color: isVoiceListening ? '#ffffff' : '#0f172a',
              border: isVoiceListening ? '1px solid #b91c1c' : '1px solid #cbd5e1',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isVoiceListening ? '0 0 0 3px rgba(239, 68, 68, 0.3)' : 'none',
            }}
          >
            {isVoiceListening ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} color="#64748b" />}
            <span id="voice-status-pill">{isVoiceListening ? 'Listening Voice...' : '🎙️ Voice Dictation'}</span>
          </button>

          {/* Rapid Mode Toggle Button */}
          <button
            id="toggle-rapid-mode-btn"
            onClick={toggleRapidMode}
            className="btn btn-sm"
            style={{
              background: rapidMode ? '#0284c7' : '#f1f5f9',
              color: rapidMode ? '#ffffff' : '#0f172a',
              border: rapidMode ? '1px solid #0369a1' : '1px solid #cbd5e1',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} color={rapidMode ? '#fbbf24' : '#64748b'} />
            <span>{rapidMode ? 'Exit Rapid Mode' : '⚡ 45s Rapid Mode'}</span>
          </button>

          {/* Live Timer Ticker */}
          <div
            id="rapid-charting-timer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            <Clock size={13} color={timerBadgeColor} />
            <span style={{ color: timerBadgeColor }}>
              00:{secondsElapsed.toString().padStart(2, '0')}s
            </span>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>/ &lt;45s</span>
            {secondsElapsed > 0 && (
              <button
                onClick={resetTimer}
                title="Reset timer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0 2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>

          {/* 1-Click Auto-Generate Phased Treatment Plan */}
          {onAutoGeneratePlan && (
            <button
              id="auto-generate-plan-btn"
              onClick={onAutoGeneratePlan}
              disabled={isAutoPlanLoading}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Wand2 size={14} />
              <span>
                {isAutoPlanLoading
                  ? 'Generating Plan...'
                  : `⚡ Auto-Generate Plan (${defectStats.totalDefects} Findings)`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Rapid Mode Hotkey & Macro Bar (Collapsible or always visible when rapidMode is on) */}
      <div
        id="rapid-hotkey-bar"
        style={{
          background: rapidMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#f8fafc',
          border: rapidMode ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Active Tooth & Keyboard Hotkeys */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: rapidMode ? '#93c5fd' : '#475569', textTransform: 'uppercase' }}>
              Active Tooth: <strong style={{ color: rapidMode ? '#38bdf8' : '#0284c7' }}>#{selectedTooth || 'None (Click tooth)'}</strong>
            </span>

            {/* Quick condition hotkey badges */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { key: 'C', label: 'Caries', cond: 'caries' as ToothCondition, bg: '#f59e0b', color: '#fff' },
                { key: 'F', label: 'Filling', cond: 'filling' as ToothCondition, bg: '#3b82f6', color: '#fff' },
                { key: 'R', label: 'Crown/RCT', cond: 'crown' as ToothCondition, bg: '#8b5cf6', color: '#fff' },
                { key: 'H', label: 'Healthy', cond: 'healthy' as ToothCondition, bg: '#10b981', color: '#fff' },
                { key: 'M', label: 'Missing', cond: 'missing' as ToothCondition, bg: '#64748b', color: '#fff' },
              ].map((hk) => (
                <button
                  key={hk.key}
                  id={`hotkey-btn-${hk.cond}`}
                  onClick={() => applyQuickCondition(hk.cond)}
                  title={`Hotkey [${hk.key}]: Set tooth #${selectedTooth || 'current'} to ${hk.label}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: hk.bg,
                    color: hk.color,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }}
                >
                  <kbd style={{ background: 'rgba(0,0,0,0.25)', padding: '1px 4px', borderRadius: '3px', fontSize: '10px' }}>
                    {hk.key}
                  </kbd>
                  <span>{hk.label}</span>
                </button>
              ))}
            </div>

            {/* Navigation arrows */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                id="prev-tooth-btn"
                onClick={() => advanceTooth(-1)}
                title="Previous Tooth (ArrowLeft / Shift+Tab)"
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                id="next-tooth-btn"
                onClick={() => advanceTooth(1)}
                title="Next Tooth (ArrowRight / Tab)"
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Timer status badge */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: timerBadgeColor }}>
            ● {timerStatusLabel}
          </div>
        </div>

        {/* Macro Clinical Batch Presets */}
        {onBatchConditionChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', borderTop: rapidMode ? '1px solid #334155' : '1px dashed #cbd5e1', paddingTop: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: rapidMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
              ⚡ Chairside Macros:
            </span>
            <button
              id="macro-upper-molars"
              onClick={() => applyMacro('upper_molars')}
              className="btn btn-sm"
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: rapidMode ? '#334155' : '#ffffff',
                color: rapidMode ? '#f1f5f9' : '#0f172a',
                border: rapidMode ? '1px solid #475569' : '1px solid #cbd5e1',
              }}
            >
              Upper Molars Caries (18-16, 26-28)
            </button>
            <button
              id="macro-lower-molars"
              onClick={() => applyMacro('lower_molars')}
              className="btn btn-sm"
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: rapidMode ? '#334155' : '#ffffff',
                color: rapidMode ? '#f1f5f9' : '#0f172a',
                border: rapidMode ? '1px solid #475569' : '1px solid #cbd5e1',
              }}
            >
              Lower Molars RCT/Crowns (46-48, 36-38)
            </button>
            <button
              id="macro-anterior-cosmetic"
              onClick={() => applyMacro('anterior_cosmetic')}
              className="btn btn-sm"
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: rapidMode ? '#334155' : '#ffffff',
                color: rapidMode ? '#f1f5f9' : '#0f172a',
                border: rapidMode ? '1px solid #475569' : '1px solid #cbd5e1',
              }}
            >
              Anterior Cosmetic Fillings (13-23)
            </button>
            <button
              id="macro-full-healthy"
              onClick={() => applyMacro('full_healthy')}
              className="btn btn-sm"
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: rapidMode ? '#334155' : '#ffffff',
                color: rapidMode ? '#f1f5f9' : '#0f172a',
                border: rapidMode ? '1px solid #475569' : '1px solid #cbd5e1',
              }}
            >
              Full Mouth Scaled (All Healthy)
            </button>
          </div>
        )}

        {/* Hands-Free Voice Assistant Interactive Bar */}
        <div
          id="voice-assistant-bar"
          style={{
            background: isVoiceListening ? 'linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)' : '#f1f5f9',
            border: isVoiceListening ? '1px solid #ef4444' : '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: isVoiceListening ? '#fca5a5' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={13} color={isVoiceListening ? '#ef4444' : '#64748b'} />
              <span>Voice Bar:</span>
            </span>
            <span id="voice-transcript" style={{ fontSize: '11px', fontFamily: 'monospace', color: isVoiceListening ? '#ffffff' : '#0f172a', fontWeight: 600 }}>
              {voiceTranscript ? `"${voiceTranscript}"` : isVoiceListening ? 'Listening for dictation...' : 'Ready for clinical call-outs'}
            </span>
            {voiceFeedback && (
              <span id="voice-feedback-badge" style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                {voiceFeedback}
              </span>
            )}
          </div>

          {/* Quick Voice Trigger Simulation Chips */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              id="voice-chip-16-caries"
              onClick={() => handleVoiceCommand('Chart 16 Caries')}
              title="Voice simulation: Chart 16 Caries"
              style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
            >
              🗣️ &quot;16 Caries&quot;
            </button>
            <button
              id="voice-chip-36-rct"
              onClick={() => handleVoiceCommand('Chart 36 RCT')}
              title="Voice simulation: Chart 36 RCT"
              style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
            >
              🗣️ &quot;36 RCT&quot;
            </button>
            <button
              id="voice-chip-macro-upper"
              onClick={() => handleVoiceCommand('Macro Upper Molars')}
              title="Voice simulation: Macro Upper Molars"
              style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
            >
              🗣️ &quot;Upper Molars&quot;
            </button>
            <button
              id="voice-chip-pediatric"
              onClick={() => handleVoiceCommand('Switch to Pediatric')}
              title="Voice simulation: Switch to Pediatric"
              style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
            >
              🗣️ &quot;Pediatric Arch&quot;
            </button>
          </div>
        </div>
      </div>

      {/* Dental Arch SVG Layout Container */}
      <div
        style={{
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          background: 'var(--color-canvas-subtle, #f8fafc)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '1.25rem 0.75rem',
          border: 'var(--border-hairline, 1px solid #e2e8f0)',
        }}
      >
        <div style={{ minWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Maxillary Arch (Upper Jaw) */}
          <div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-ink-tertiary, #94a3b8)', letterSpacing: '0.05em', marginBottom: '4px' }}>
              {dentitionMode === 'adult'
                ? 'Permanent Adult Dentition (32 Teeth • FDI 11-48)'
                : 'Pediatric Primary Dentition (20 Teeth • Milk Dentition 51-85)'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
              {dentitionMode === 'adult' ? (
                <>
                  {/* Upper Right Quadrant 1 */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {UPPER_TEETH.slice(0, 8).map((t) => renderTooth(t, true))}
                  </div>
                  {/* Midline Divider */}
                  <div style={{ width: '2px', height: '56px', background: 'var(--color-ink-muted, #cbd5e1)', margin: '0 6px' }} />
                  {/* Upper Left Quadrant 2 */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {UPPER_TEETH.slice(8, 16).map((t) => renderTooth(t, true))}
                  </div>
                </>
              ) : (
                <div id="pediatric-upper-arch" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Deciduous Upper Right Quadrant 5 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PEDIATRIC_UPPER_TEETH.slice(0, 5).map((t) => renderTooth(t, true))}
                  </div>
                  {/* Midline Divider */}
                  <div style={{ width: '2px', height: '56px', background: '#ec4899', margin: '0 8px' }} />
                  {/* Deciduous Upper Left Quadrant 6 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PEDIATRIC_UPPER_TEETH.slice(5, 10).map((t) => renderTooth(t, true))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Arch Separator */}
          <div style={{ borderTop: '1px dashed var(--color-ink-muted, #cbd5e1)', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                top: '-9px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--color-canvas-subtle, #f8fafc)',
                padding: '0 8px',
                fontSize: '10px',
                color: 'var(--color-ink-tertiary, #94a3b8)',
                fontWeight: 700,
              }}
            >
              OCCLUSAL PLANE ({dentitionMode === 'adult' ? '32 ADULT PERMANENT' : '20 PRIMARY DECIDUOUS'})
            </span>
          </div>

          {/* Mandibular Arch (Lower Jaw) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
              {dentitionMode === 'adult' ? (
                <>
                  {/* Lower Right Quadrant 4 */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {LOWER_TEETH.slice(0, 8).map((t) => renderTooth(t, false))}
                  </div>
                  {/* Midline Divider */}
                  <div style={{ width: '2px', height: '56px', background: 'var(--color-ink-muted, #cbd5e1)', margin: '0 6px' }} />
                  {/* Lower Left Quadrant 3 */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {LOWER_TEETH.slice(8, 16).map((t) => renderTooth(t, false))}
                  </div>
                </>
              ) : (
                <div id="pediatric-lower-arch" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Deciduous Lower Right Quadrant 8 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PEDIATRIC_LOWER_TEETH.slice(0, 5).map((t) => renderTooth(t, false))}
                  </div>
                  {/* Midline Divider */}
                  <div style={{ width: '2px', height: '56px', background: '#ec4899', margin: '0 8px' }} />
                  {/* Deciduous Lower Left Quadrant 7 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PEDIATRIC_LOWER_TEETH.slice(5, 10).map((t) => renderTooth(t, false))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-ink-tertiary, #94a3b8)', letterSpacing: '0.05em', marginTop: '4px' }}>
              {dentitionMode === 'adult'
                ? 'MANDIBULAR ARCH (LOWER JAW - PERMANENT 48-38)'
                : 'MANDIBULAR ARCH (DECIDUOUS MILK TEETH 85-75)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
