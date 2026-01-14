import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { Terminal, WireConnection } from '../types';

interface UseWireDrawingParams {
  onConnectionChange: (connections: WireConnection[]) => void;
  onComplete?: () => void;
}

interface UseWireDrawingReturn {
  connections: WireConnection[];
  isDrawing: boolean;
  startPoint: Terminal | null;
  currentPoint: { x: number; y: number } | null;
  startDrawing: (terminal: Terminal) => void;
  updateDrawing: (point: { x: number; y: number }) => void;
  completeDrawing: (terminal: Terminal) => void;
  cancelDrawing: () => void;
  removeConnection: (index: number) => void;
}

/**
 * 导线绘制逻辑 Hook
 * 管理接线的状态、拖拽绘制、删除等功能
 */
export function useWireDrawing(params: UseWireDrawingParams): UseWireDrawingReturn {
  const { onConnectionChange, onComplete } = params;

  const [connections, setConnections] = useState<WireConnection[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Terminal | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

  /**
   * 开始绘制导线
   */
  const startDrawing = useCallback((terminal: Terminal) => {
    // 只能从输出端子或源端子开始
    if (terminal.type !== 'output' && terminal.type !== 'source') {
      message.warning('请从输出端子开始接线');
      return;
    }

    setIsDrawing(true);
    setStartPoint(terminal);
    setCurrentPoint(terminal.position);
  }, []);

  /**
   * 更新绘制中的导线终点
   */
  const updateDrawing = useCallback((point: { x: number; y: number }) => {
    if (!isDrawing) return;
    setCurrentPoint(point);
  }, [isDrawing]);

  /**
   * 完成导线绘制
   */
  const completeDrawing = useCallback((terminal: Terminal) => {
    if (!startPoint || !isDrawing) return;

    // 不能连接到同一个端子
    if (terminal.id === startPoint.id) {
      message.warning('不能连接到同一个端子');
      return;
    }

    // 只允许：source/output → input
    // 不允许：source/output → source/output（同类型连接）
    if (terminal.type === startPoint.type) {
      const typeNames = {
        source: '电源端子',
        output: '输出端子',
        input: '输入端子'
      };
      message.warning(`${typeNames[startPoint.type]}不能连接到${typeNames[terminal.type]}，请连接到输入端子`);
      return;
    }

    // 不允许：input → source/output
    if (startPoint.type === 'input') {
      message.warning('请从输出端子或电源端子开始接线');
      return;
    }

    // 检查是否已存在相同连接
    const existingConnection = connections.find(
      conn => conn.from.id === startPoint.id && conn.to.id === terminal.id
    );

    if (existingConnection) {
      message.warning('该连接已存在');
      return;
    }

    // 创建新连接
    const newConnection: WireConnection = {
      id: `wire-${Date.now()}`,
      from: startPoint,
      to: terminal,
      color: '#e74c3c'
    };

    const updatedConnections = [...connections, newConnection];
    setConnections(updatedConnections);
    onConnectionChange(updatedConnections);

    // 重置状态
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);

    // 检查是否完成所有必需连接
    if (onComplete) {
      checkCompletion(updatedConnections);
    }
  }, [startPoint, isDrawing, connections, onConnectionChange, onComplete]);

  /**
   * 取消绘制
   */
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  /**
   * 删除连接
   */
  const removeConnection = useCallback((index: number) => {
    const updatedConnections = connections.filter((_, i) => i !== index);
    setConnections(updatedConnections);
    onConnectionChange(updatedConnections);
  }, [connections, onConnectionChange]);

  /**
   * 检查是否完成所有必需连接（简化版）
   */
  const checkCompletion = useCallback((currentConnections: WireConnection[]) => {
    // 这里需要根据规则验证，简化处理
    if (currentConnections.length >= 3) {
      message.success('接线完成！');
      onComplete?.();
    }
  }, [onComplete]);

  return {
    connections,
    isDrawing,
    startPoint,
    currentPoint,
    startDrawing,
    updateDrawing,
    completeDrawing,
    cancelDrawing,
    removeConnection
  };
}
