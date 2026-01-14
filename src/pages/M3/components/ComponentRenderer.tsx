import { memo, useCallback } from 'react';
import { Group, Rect, Text, Circle, Line } from 'react-konva';
import type { WiringComponent, Terminal, TerminalType } from '../types';

/**
 * 元件渲染组件属性
 */
interface ComponentRendererProps {
  /** 元件对象 */
  component: WiringComponent;
  /** 悬停的端子 ID（使用 Ref，不触发重渲染） */
  hoveredTerminalId: string | null;
  /** 选中状态 */
  isSelected?: boolean;
  /** 端子点击回调 */
  onTerminalClick?: (terminal: Terminal) => void;
  /** 端子悬停回调 */
  onTerminalHover?: (terminalId: string | null) => void;
}

/**
 * 端子颜色映射（根据类型）
 */
const TERMINAL_COLORS: Record<TerminalType, { default: string; hover: string }> = {
  source: { default: '#e74c3c', hover: '#ff7875' },
  input: { default: '#1890ff', hover: '#40a9ff' },
  output: { default: '#52c41a', hover: '#73d13d' }
};

/**
 * 端子渲染组件
 */
interface TerminalRendererProps {
  terminal: Terminal;
  component: WiringComponent;
  isHovered: boolean;
  onClick: (terminal: Terminal) => void;
  onHover: (terminalId: string | null) => void;
}

function TerminalRenderer({
  terminal,
  component,
  isHovered,
  onClick,
  onHover
}: TerminalRendererProps) {
  // 获取端子视觉配置
  const visual = terminal.visual || {};
  const radius = visual.radius || 7;
  const hoverRadius = visual.hoverRadius || 10;
  const defaultColor = visual.color || TERMINAL_COLORS[terminal.type].default;
  const hoverColor = visual.hoverColor || TERMINAL_COLORS[terminal.type].hover;
  const strokeWidth = visual.strokeWidth || 2;

  // 计算端子标签位置（在元件外侧）
  const labelOffset = 20;
  const isLeftSide = terminal.position.x < component.position.x;
  const labelX = isLeftSide
    ? terminal.position.x - labelOffset
    : terminal.position.x + labelOffset;

  // 处理点击事件
  const handleClick = useCallback((e: any) => {
    e.cancelBubble = true;
    onClick(terminal);
  }, [terminal, onClick]);

  // 处理悬停事件
  const handleMouseEnter = useCallback(() => {
    onHover(terminal.id);
  }, [terminal.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <Group>
      {/* 端子圆形 */}
      <Circle
        x={terminal.position.x}
        y={terminal.position.y}
        radius={isHovered ? hoverRadius : radius}
        fill={isHovered ? hoverColor : defaultColor}
        stroke="#fff"
        strokeWidth={strokeWidth}
        shadowColor="black"
        shadowBlur={isHovered ? 8 : 3}
        shadowOpacity={isHovered ? 0.4 : 0.2}
        name="terminal"
        terminalId={terminal.id}
        hitStrokeWidth={20}
        listening={true}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTap={handleClick}
      />

      {/* 端子标签 */}
      <Text
        x={labelX}
        y={terminal.position.y - 6}
        text={terminal.label}
        fontSize={12}
        fill="#333"
        fontStyle="bold"
        align={isLeftSide ? 'right' : 'left'}
        offsetX={isLeftSide ? 0 : 0}
      />

      {/* 端子悬停效果（外圈） */}
      {isHovered && (
        <Circle
          x={terminal.position.x}
          y={terminal.position.y}
          radius={hoverRadius + 4}
          stroke={hoverColor}
          strokeWidth={2}
          opacity={0.5}
          dash={[4, 4]}
        />
      )}
    </Group>
  );
}

/**
 * 元件渲染组件
 *
 * 负责渲染电气元件，包括：
 * - 元件主体（矩形 + 阴影）
 * - 元件名称和图标
 * - 内部电气符号（根据类型）
 * - 端子（可点击、悬停反馈）
 *
 * 使用 memo 优化性能，仅在组件对象或悬停状态变化时重新渲染。
 */
function ComponentRenderer({
  component,
  hoveredTerminalId,
  isSelected = false,
  onTerminalClick,
  onTerminalHover
}: ComponentRendererProps) {
  const { position, terminals, color, name, icon, visual } = component;

  // 获取视觉配置
  const width = visual?.width || 80;
  const height = visual?.height || 60;
  const cornerRadius = visual?.cornerRadius || 4;
  const borderWidth = visual?.borderWidth || 2;
  const showShadow = visual?.showShadow !== false;

  // 处理端子点击
  const handleTerminalClick = useCallback((terminal: Terminal) => {
    onTerminalClick?.(terminal);
  }, [onTerminalClick]);

  // 处理端子悬停
  const handleTerminalHover = useCallback((terminalId: string | null) => {
    onTerminalHover?.(terminalId);
  }, [onTerminalHover]);

  // 渲染内部电气符号
  const renderInnerSymbol = () => {
    const symbolType = visual?.innerSymbol;
    const cx = position.x;
    const cy = position.y;
    const symbolSize = Math.min(width, height) * 0.4;

    switch (symbolType) {
      case 'switch':
        // 开关符号
        return (
          <>
            <Line
              points={[
                cx - symbolSize / 2, cy,
                cx + symbolSize / 4, cy - symbolSize / 3
              ]}
              stroke="#fff"
              strokeWidth={2}
              lineCap="round"
            />
            <Circle
              x={cx + symbolSize / 2}
              y={cy}
              radius={3}
              fill="#fff"
            />
          </>
        );

      case 'coil':
        // 线圈符号（矩形波浪）
        return (
          <Rect
            x={cx - symbolSize / 2}
            y={cy - symbolSize / 4}
            width={symbolSize}
            height={symbolSize / 2}
            stroke="#fff"
            strokeWidth={2}
            cornerRadius={symbolSize / 4}
          />
        );

      case 'motor':
        // 电机符号（圆形 + M）
        return (
          <>
            <Circle
              x={cx}
              y={cy}
              radius={symbolSize / 2}
              stroke="#fff"
              strokeWidth={2}
            />
            <Text
              x={cx}
              y={cy}
              text="M"
              fontSize={symbolSize / 2}
              fill="#fff"
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              offsetY={symbolSize / 6}
            />
          </>
        );

      case 'power':
        // 电源符号（闪电）
        return (
          <Text
            x={cx}
            y={cy}
            text="⚡"
            fontSize={symbolSize}
            align="center"
            verticalAlign="middle"
            offsetY={symbolSize / 3}
          />
        );

      default:
        // 默认：显示图标
        return (
          <Text
            x={cx}
            y={cy}
            text={icon || ''}
            fontSize={20}
            align="center"
            verticalAlign="middle"
          />
        );
    }
  };

  return (
    <Group>
      {/* 元件阴影 */}
      {showShadow && (
        <Rect
          x={position.x - width / 2 + 4}
          y={position.y - height / 2 + 4}
          width={width}
          height={height}
          fill="black"
          opacity={0.15}
          cornerRadius={cornerRadius}
        />
      )}

      {/* 元件主体 */}
      <Rect
        x={position.x - width / 2}
        y={position.y - height / 2}
        width={width}
        height={height}
        fill={color}
        stroke="#333"
        strokeWidth={isSelected ? borderWidth + 2 : borderWidth}
        cornerRadius={cornerRadius}
        shadowColor="black"
        shadowBlur={isSelected ? 15 : 5}
        shadowOpacity={isSelected ? 0.4 : 0.2}
      />

      {/* 内部电气符号 */}
      {renderInnerSymbol()}

      {/* 元件名称 */}
      <Text
        x={position.x}
        y={position.y - height / 2 + 12}
        text={name}
        fontSize={11}
        fill="#fff"
        fontStyle="bold"
        align="center"
        shadowColor="black"
        shadowBlur={2}
        shadowOpacity={0.3}
      />

      {/* 端子 */}
      {terminals.map(terminal => (
        <TerminalRenderer
          key={terminal.id}
          terminal={terminal}
          component={component}
          isHovered={hoveredTerminalId === terminal.id}
          onClick={handleTerminalClick}
          onHover={handleTerminalHover}
        />
      ))}
    </Group>
  );
}

/**
 * 元件渲染组件（memo 版本）
 *
 * 仅在组件对象或悬停状态变化时重新渲染，优化性能。
 */
export default memo(ComponentRenderer, (prevProps, nextProps) => {
  return (
    prevProps.component.id === nextProps.component.id &&
    prevProps.hoveredTerminalId === nextProps.hoveredTerminalId &&
    prevProps.isSelected === nextProps.isSelected
  );
});
