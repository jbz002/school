// 几何体类型
export type GeometryType = 'box' | 'cylinder' | 'sphere';

// 几何体参数
export interface GeometryParams {
  type: GeometryType;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
}

// 元件位置
export interface ComponentPosition {
  x: number;
  y: number;
  z: number;
}

// 电气元件
export interface ElectricalComponent {
  id: string;
  name: string;
  voltage: string;
  function: string;
  risk: string;
  position: ComponentPosition;
  geometry: GeometryParams;
  color: string;
  schematicId: string;
}

// 题目类型
export type QuizType = 'click' | 'choice';

// 测验题目
export interface Quiz {
  id: number;
  question: string;
  type: QuizType;
  targetId?: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
}

// 测验数据
export interface QuizData {
  components: ElectricalComponent[];
  quiz: Quiz[];
}

// 用户答题记录
export interface QuizAttempt {
  quizId: number;
  isCorrect: boolean;
  timeSpent: number;
}

// 页面模式
export type PageMode = 'explore' | 'quiz';

// 测验状态
export interface QuizState {
  current: number;
  score: number;
  attempts: QuizAttempt[];
  isFinished: boolean;
  timeRemaining: number;
}
