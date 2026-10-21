export type TrustLadderLevel = 0 | 1 | 2 | 3 | 4;

export interface LadderStepInfo {
  level: TrustLadderLevel;
  title: string;
  effect: string;
  dialogue: string;
  danger: boolean;
}

export interface ChoiceOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  isWise?: boolean;
  isSetback?: boolean;
  isDeath?: boolean;
  ladderChange: number; // e.g. -1, 0, +1, +2
  feedbackText: string;
  nextSceneId?: number;
  triggerDeath?: boolean;
  triggerQuit?: boolean;
}

export interface SceneData {
  id: number;
  title: string;
  dateOrPeriod: string;
  description: string;
  question: string;
  hint: string;
  options: ChoiceOption[];
  requiresSecondChoice?: boolean;
  secondQuestion?: string;
  secondOptions?: ChoiceOption[];
}

export interface CompetenceGoal {
  id: string;
  title: string;
  curriculumCode: string; // e.g. LK20 Samfunnsfag 10. trinn
  description: string;
  lookFor: string;
  sampleFeedback: string;
  sceneTrigger: string;
}

export interface AppIdea {
  id: string;
  title: string;
  tagline: string;
  category: string;
  targetAudience: string;
  description: string;
  coreMechanics: string[];
  pedagogicalBenefits: string[];
  techStack: string[];
  teacherTools: string[];
  challengesAndMitigations: { challenge: string; solution: string }[];
  promptTemplateKey: string;
}

export interface PlayerSession {
  student1: string;
  student2: string;
  currentSceneId: number;
  ladderLevel: TrustLadderLevel;
  history: {
    sceneId: number;
    userInput: string;
    hasOver: boolean;
    aiResponse: string;
    timestamp: number;
    chosenOptionId?: string;
    ladderDelta?: number;
  }[];
  isFinished: boolean;
  outcome: 'won' | 'death' | 'starved' | 'declined' | 'in_progress';
  deathReason?: string;
  elapsedSeconds: number;
  wantsRealHistory?: boolean;
}
