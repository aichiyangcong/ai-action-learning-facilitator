import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

export interface TopicData {
  title: string;
  background: string;
  painPoints: string;
  triedActions: string;
}

export interface TopicEvaluation {
  totalScore: number;
  dimensions: {
    focus: number;
    resultOriented: number;
    singleIssue: number;
    uncertainty: number;
    controllability: number;
    learning: number;
  };
  suggestions: string[];
  examples: { title: string; description: string }[];
}

export interface PreMortemData {
  warning: string;
  riskFactors: string[];
  focusAreas: string[];
}

export interface Question {
  id: string;
  text: string;
  author: string;
  category: 'fact' | 'feeling' | 'finding' | 'future' | 'focus';
  categoryLabel: string;
  isGolden: boolean;
  isShadow: boolean;
  adopted: boolean | null;
}

export interface RadarData {
  fact: number;
  feeling: number;
  finding: number;
  future: number;
  focus: number;
}

export interface ActionItem {
  id: string;
  owner: string;
  action: string;
  deadline: string;
}

interface WorkshopContextValue {
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  topic: TopicData;
  setTopic: (topic: TopicData) => void;
  evaluation: TopicEvaluation | null;
  setEvaluation: (evaluation: TopicEvaluation | null) => void;
  preMortem: PreMortemData | null;
  setPreMortem: (data: PreMortemData | null) => void;
  questions: Question[];
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  radarData: RadarData;
  updateRadarData: () => void;
  goldenQuestions: Question[];
  reflections: string;
  setReflections: (text: string) => void;
  actionPlan: ActionItem[];
  addActionItem: (item: ActionItem) => void;
  updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  removeActionItem: (id: string) => void;
  summaryReport: string;
  setSummaryReport: (text: string) => void;
  resetWorkshop: () => void;
}

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

const defaultTopic: TopicData = {
  title: '',
  background: '',
  painPoints: '',
  triedActions: '',
};

const defaultRadar: RadarData = {
  fact: 0,
  feeling: 0,
  finding: 0,
  future: 0,
  focus: 0,
};

let idCounter = 0;
export function generateId(): string {
  idCounter++;
  return `id-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [topic, setTopic] = useState<TopicData>(defaultTopic);
  const [evaluation, setEvaluation] = useState<TopicEvaluation | null>(null);
  const [preMortem, setPreMortem] = useState<PreMortemData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [radarData, setRadarData] = useState<RadarData>(defaultRadar);
  const [reflections, setReflections] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<ActionItem[]>([]);
  const [summaryReport, setSummaryReport] = useState<string>('');

  const addQuestion = useCallback((question: Question) => {
    setQuestions(prev => [...prev, question]);
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, []);

  const updateRadarData = useCallback(() => {
    setQuestions(currentQuestions => {
      const adopted = currentQuestions.filter(q => q.adopted !== false);
      const counts: RadarData = { fact: 0, feeling: 0, finding: 0, future: 0, focus: 0 };
      adopted.forEach(q => {
        if (counts[q.category] !== undefined) {
          counts[q.category]++;
        }
      });
      setRadarData(counts);
      return currentQuestions;
    });
  }, []);

  const goldenQuestions = useMemo(() => questions.filter(q => q.isGolden), [questions]);

  const addActionItem = useCallback((item: ActionItem) => {
    setActionPlan(prev => [...prev, item]);
  }, []);

  const updateActionItem = useCallback((id: string, updates: Partial<ActionItem>) => {
    setActionPlan(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const removeActionItem = useCallback((id: string) => {
    setActionPlan(prev => prev.filter(item => item.id !== id));
  }, []);

  const resetWorkshop = useCallback(() => {
    setCurrentStage(1);
    setTopic(defaultTopic);
    setEvaluation(null);
    setPreMortem(null);
    setQuestions([]);
    setRadarData(defaultRadar);
    setReflections('');
    setActionPlan([]);
    setSummaryReport('');
  }, []);

  const value = useMemo(() => ({
    currentStage,
    setCurrentStage,
    topic,
    setTopic,
    evaluation,
    setEvaluation,
    preMortem,
    setPreMortem,
    questions,
    addQuestion,
    updateQuestion,
    radarData,
    updateRadarData,
    goldenQuestions,
    reflections,
    setReflections,
    actionPlan,
    addActionItem,
    updateActionItem,
    removeActionItem,
    summaryReport,
    setSummaryReport,
    resetWorkshop,
  }), [
    currentStage, topic, evaluation, preMortem, questions,
    addQuestion, updateQuestion, radarData, updateRadarData,
    goldenQuestions, reflections, actionPlan, addActionItem,
    updateActionItem, removeActionItem, summaryReport, resetWorkshop,
  ]);

  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop() {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
}
