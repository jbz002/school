import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type { WiringComponent, WireConnection, Terminal } from '../types';
import { useWireDrawing } from '../hooks/useWireDrawing';
import { useTerminalHitTest } from '../hooks/useTerminalHitTest';
import { calculateWirePath } from '../utils/wirePaths';
import ComponentRenderer from './ComponentRenderer';
import WireRenderer from './WireRenderer';

/**
 * 接线画布组件属性
 */
interface WiringCanvasProps {
  /** 元件列表 */
  components: WiringComponent[];
  /** 连接变化回调 */
  onConnectionChange: (connections: WireConnection[]) => void;
  /** 完成回调 */
  onComplete?: () => void;
  /** 碰撞检测配置 */
  hitTestConfig?: {
    clickThreshold?: number;
    hoverThreshold?: number;
    cellSize?: number;
  };
  /** 导线样式配置 */
  wireStyle?: {
    thickness?: number;
    showDeleteButton?: boolean;
  };
}

/**
 * 接线画布组件
 *
 * 负责渲染接线画布和处理用户交互，包括：
 * - 画布尺寸自适应
 * - 端子碰撞检测（使用空间哈希优化）
 * - 鼠标事件处理（移动、点击）
 * - 导线绘制（引导线 + 已完成连接）
 * - 元件渲染
 *
 * 性能优化：
 * - 使用空间哈希网格将端子查找从 O(n) 优化到接近 O(1)
 * - 使用 Ref 存储悬停状态，避免不必要的 React 重渲染
 * - 使用 requestAnimationFrame 节流鼠标移动事件
 */
function WiringCanvas({
  components,
  onConnectionChange,
  onComplete,
  hitTestConfig = {},
  wireStyle = {}
}: WiringCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);

  // 合并配置
  const {
    clickThreshold = 20,
    hoverThreshold = 20,
    cellSize = 50
  } = hitTestConfig;

  // 使用端子碰撞检测 Hook
  const {
    findTerminalAt,
    checkHover,
    hoveredTerminal,
    findTerminalById
  } = useTerminalHitTest(components, {
    clickThreshold,
    hoverThreshold,
    cellSize
  });

  // 使用导线绘制 Hook
  const {
    connections,
    isDrawing,
    startPoint,
    currentPoint,
    startDrawing,
    updateDrawing,
    cancelDrawing,
    completeDrawing,
    removeConnection
  } = useWireDrawing({
    onConnectionChange,
    onComplete
  });

  // 更新舞台尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 处理鼠标移动（使用 requestAnimationFrame 优化性能）
  const handleMouseMove = useCallback((e: any) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      if (isDrawing && currentPoint) {
        // 更新绘制中的导线终点
        updateDrawing({ x: pointerPos.x, y: pointerPos.y });
      } else {
        // 检查是否悬停在端子上（使用 Ref 避免重渲染）
        checkHover(pointerPos.x, pointerPos.y);
      }
    });
  }, [isDrawing, currentPoint, updateDrawing, checkHover]);

  // 处理画布点击
  const handleStageClick = useCallback((e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // 检查是否点击了端子（通过 name 属性判断）
    const clickedShape = e.target;
    if (clickedShape && clickedShape.name() === 'terminal') {
      // 端子点击由 ComponentRenderer 的 onClick 处理
      return;
    }

    // 如果点击的是 Stage 本身（空白处），取消绘制
    if (isDrawing && e.target === e.target.getStage()) {
      cancelDrawing();
    }
  }, [isDrawing, cancelDrawing]);

  // 处理端子点击（从 ComponentRenderer 触发）
  const handleTerminalClick = useCallback((terminal: Terminal) => {
    if (isDrawing) {
      completeDrawing(terminal);
    } else {
      startDrawing(terminal);
    }
  }, [isDrawing, startDrawing, completeDrawing]);

  // 处理端子悬停（从 ComponentRenderer 触发）
  const handleTerminalHover = useCallback((terminalId: string | null) => {
    hoveredTerminal.current = terminalId;
  }, []);

  // 处理删除连接
  const handleRemoveConnection = useCallback((connectionId: string) => {
    const index = connections.findIndex(c => c.id === connectionId);
    if (index !== -1) {
      removeConnection(index);
    }
  }, [connections, removeConnection]);

  // 处理导线悬停
  const handleWireHover = useCallback((wireId: string | null) => {
    setHoveredWireId(wireId);
  }, []);

  // 清理 RAF
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // 计算连接数和目标数（用于进度显示）
  const connectionCount = useMemo(() => connections.length, [connections]);
  const targetConnectionCount = 3; // 可以从配置读取

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#f5f5f5',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
      >
        <Layer>
          {/* 绘制连接中的引导线（虚线） */}
          {isDrawing && startPoint && currentPoint && (
            <Line
              points={calculateWirePath(startPoint.position, currentPoint, {
                style: 'bezier'
              })}
              stroke="#1890ff"
              strokeWidth={wireStyle.thickness || 3}
              dash={[8, 8]}
              lineCap="round"
              lineJoin="round"
              opacity={0.6}
            />
          )}

          {/* 渲染已完成的连接 */}
          {connections.map((connection) => (
            <WireRenderer
              key={connection.id}
              connection={connection}
              isHovered={hoveredWireId === connection.id}
              onRemove={handleRemoveConnection}
              wireStyle={wireStyle}
            />
          ))}

          {/* 渲染元件 */}
          {components.map((component) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              hoveredTerminalId={hoveredTerminal.current}
              onTerminalClick={handleTerminalClick}
              onTerminalHover={handleTerminalHover}
            />
          ))}
        </Layer>
      </Stage>

      {/* 操作提示 */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 24px',
        borderRadius: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        fontSize: '13px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        border: '1px solid #e8e8e8'
      }}>
        <span>• 点击第一个端子开始接线</span>
        <span>• 再点击目标端子完成连线</span>
        <span style={{
          color: connectionCount >= targetConnectionCount ? '#52c41a' : '#1890ff',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          已连接: {connectionCount} / {targetConnectionCount}
        </span>
        {isDrawing && (
          <span style={{ color: '#faad14', fontWeight: 'bold' }}>
            连接中...
          </span>
        )}
      </div>

      {/* 元件总数统计 */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        元件: {components.length} | 端子: {components.reduce((sum, c) => sum + c.terminals.length, 0)}
      </div>
    </div>
  );
}

export default WiringCanvas;
