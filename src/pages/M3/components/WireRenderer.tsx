import { memo } from 'react';
import { Line, Circle, Text, Group } from 'react-konva';
import type { WireConnection } from '../types';
import { calculateWirePath, calculateWireMidpoint, createWirePathConfig } from '../utils/wirePaths';

/**
 * 导线渲染组件属性
 */
interface WireRendererProps {
  /** 导线连接对象 */
  connection: WireConnection;
  /** 是否处于悬停状态 */
  isHovered?: boolean;
  /** 删除连接的回调 */
  onRemove?: (connectionId: string) => void;
  /** 导线样式配置 */
  wireStyle?: {
    thickness?: number;
    showDeleteButton?: boolean;
    deleteButtonRadius?: number;
  };
}

/**
 * 导线渲染组件
 *
 * 负责渲染单条导线，包括：
 * - 导线路径（支持贝塞尔曲线、直线、正交线）
 * - 删除按钮（中点 × 图标）
 * - 悬停效果
 *
 * 使用 memo 优化性能，仅在连接对象变化时重新渲染。
 */
function WireRenderer({
  connection,
  isHovered = false,
  onRemove,
  wireStyle = {}
}: WireRendererProps) {
  const {
    thickness = 3,
    showDeleteButton = true,
    deleteButtonRadius = 12
  } = wireStyle;

  // 计算导线路径
  const pathConfig = createWirePathConfig(connection);
  const wirePath = calculateWirePath(
    connection.from.position,
    connection.to.position,
    pathConfig
  );

  // 计算中点位置（放置删除按钮）
  const midpoint = calculateWireMidpoint(
    connection.from.position,
    connection.to.position,
    wirePath
  );

  // 处理删除按钮点击
  const handleRemove = (e: any) => {
    e.cancelBubble = true;
    onRemove?.(connection.id);
  };

  return (
    <Group>
      {/* 导线路径 */}
      <Line
        points={wirePath}
        stroke={connection.color}
        strokeWidth={isHovered ? thickness + 1 : thickness}
        lineCap="round"
        lineJoin="round"
        shadowColor={connection.color}
        shadowBlur={isHovered ? 10 : 0}
        shadowOpacity={isHovered ? 0.3 : 0}
        opacity={isHovered ? 1 : 0.9}
      />

      {/* 删除按钮 */}
      {showDeleteButton && (
        <Group
          x={midpoint.x}
          y={midpoint.y}
          visible={isHovered}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'pointer';
            }
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }}
        >
          {/* 删除按钮背景圆 */}
          <Circle
            radius={deleteButtonRadius}
            fill="#ff4d4f"
            stroke="#fff"
            strokeWidth={2}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.3}
            onClick={handleRemove}
          />

          {/* 删除按钮图标（×） */}
          <Text
            text="×"
            fontSize={16}
            fill="#fff"
            align="center"
            verticalAlign="middle"
            offsetX={0}
            offsetY={5}
            onClick={handleRemove}
          />
        </Group>
      )}
    </Group>
  );
}

/**
 * 导线渲染组件（memo 版本）
 *
 * 仅在连接对象变化时重新渲染，优化性能。
 */
export default memo(WireRenderer, (prevProps, nextProps) => {
  return (
    prevProps.connection.id === nextProps.connection.id &&
    prevProps.connection.from.id === nextProps.connection.from.id &&
    prevProps.connection.to.id === nextProps.connection.to.id &&
    prevProps.isHovered === nextProps.isHovered
  );
});
