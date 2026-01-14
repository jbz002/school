// 元件类型
export type ComponentType = 'power' | 'breaker' | 'contactor' | 'motor' | 'sensor' | 'button';

// 元件分类
export type ComponentCategory = 'input' | 'output' | 'control' | 'protection' | 'load';

// 端子类型
export type TerminalType = 'source' | 'input' | 'output';

// 元件位置
export interface ComponentPosition {
  x: number;
  y: number;
}

// 端子视觉配置
export interface TerminalVisual {
  radius?: number;
  hoverRadius?: number;
  color?: string;
  hoverColor?: string;
  strokeWidth?: number;
}

// 端子
export interface Terminal {
  id: string;
  label: string;
  type: TerminalType;
  position: ComponentPosition;
  visual?: TerminalVisual;
}

// 元件视觉属性
export interface ComponentVisual {
  width: number;
  height: number;
  terminalsVisible: boolean;
  symbolStyle?: 'simple' | 'standard' | 'detailed';
  showShadow?: boolean;
  cornerRadius?: number;
  borderWidth?: number;
  innerSymbol?: string;
}

// 接线元件
export interface WiringComponent {
  id: string;
  name: string;
  type: ComponentType;
  category: ComponentCategory;
  position: ComponentPosition;
  terminals: Terminal[];
  color: string;
  icon: string;
  visual?: ComponentVisual;
}

// 导线连接
export interface WireConnection {
  id: string;
  from: Terminal;
  to: Terminal;
  color: string;
  style?: 'straight' | 'bezier' | 'orthogonal';
  showArrow?: boolean;
  showLabel?: boolean;
}

// 导线样式配置
export interface WireStyleConfig {
  type: 'straight' | 'bezier' | 'orthogonal';
  thickness: number;
  color: string;
  showArrow: boolean;
  showLabel: boolean;
}

// 端子碰撞检测配置
export interface HitTestConfig {
  threshold: number;
  hoverThreshold: number;
  useSpatialHash: boolean;
  cellSize: number;
}

// 接线规则
export interface WiringRule {
  id: string;
  name: string;
  description: string;
  type: 'sequence' | 'parallel' | 'custom';
  required: boolean;
  connections: Array<{
    from: string;
    to: string;
    type: 'required' | 'optional';
  }>;
  forbidden: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  feedback: {
    success: string;
    partial: string;
    error: string;
  };
}

// 接线规则配置
export interface WiringValidation {
  allowMultipleWires: boolean;
  allowCrossConnect: boolean;
  checkShortCircuit: boolean;
  checkPolarity: boolean;
}

// 接线数据
export interface WiringData {
  components: WiringComponent[];
  wires: {
    colors: string[];
    defaultColor: string;
    thickness: number;
  };
}

// 规则数据
export interface RulesData {
  rules: WiringRule[];
  validation: WiringValidation;
}
