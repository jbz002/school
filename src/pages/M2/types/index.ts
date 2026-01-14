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

// 元件分类
export type ComponentCategory = 'power' | 'control' | 'sensor';

// 动画类型
export type AnimationType = 'switch' | 'rotate' | 'glow' | 'none';

// 动画配置
export interface AnimationConfig {
  hasAnimation: boolean;
  animationType: AnimationType;
}

// 常见故障
export interface CommonFault {
  name: string;
  cause: string;
  solution: string;
}

// 电气元件（扩展版）
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
  // 新增字段
  category: ComponentCategory;
  model: string;
  ratedCurrent: string;
  workingPrinciple: string;
  installationPosition: string;
  maintenancePeriod: string;
  commonFaults: CommonFault[];
  safetySteps: string[];
  animationConfig: AnimationConfig;
}

// 元件分类数据
export interface ComponentCategoryData {
  name: string;
  components: string[];
  color: string;
}

// 元件分类索引
export interface ComponentCategories {
  power: ComponentCategoryData;
  control: ComponentCategoryData;
  sensor: ComponentCategoryData;
}

// 题目类型
export type QuizType = 'click' | 'choice';

// 题目难度
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

// 测验题目（扩展版）
export interface Quiz {
  id: number;
  question: string;
  type: QuizType;
  targetId?: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
  // 新增字段
  explanation?: string;
  difficulty?: QuizDifficulty;
}

// 测验数据（扩展版）
export interface QuizData {
  categories?: ComponentCategories;
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
