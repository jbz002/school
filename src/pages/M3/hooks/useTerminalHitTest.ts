import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { WiringComponent, Terminal } from '../types';
import { SpatialHashGrid, createSpatialHashGrid } from '../utils/spatialHash';

/**
 * 端子碰撞检测配置
 */
export interface HitTestConfig {
  /** 点击检测阈值（像素），默认 20 */
  clickThreshold: number;
  /** 悬停检测阈值（像素），默认 20 */
  hoverThreshold: number;
  /** 空间哈希网格单元大小（像素），默认 50 */
  cellSize: number;
}

/**
 * 端子碰撞检测 Hook 返回值
 */
export interface UseTerminalHitTestReturn {
  /** 查找指定位置的端子 */
  findTerminalAt: (x: number, y: number, radius?: number) => Terminal | null;
  /** 检查是否悬停在端子上 */
  checkHover: (x: number, y: number) => Terminal | null;
  /** 当前悬停的端子 ID（使用 Ref，不触发重渲染） */
  hoveredTerminal: React.MutableRefObject<string | null>;
  /** 根据端子 ID 查找端子对象 */
  findTerminalById: (terminalId: string) => Terminal | null;
  /** 获取所有端子列表 */
  getAllTerminals: () => Terminal[];
  /** 空间哈希网格实例（用于调试） */
  spatialGrid: SpatialHashGrid<Terminal>;
}

/**
 * 端子碰撞检测 Hook
 *
 * 使用空间哈希网格优化端子查找性能，将 O(n) 复杂度降低到接近 O(1)。
 * 使用 Ref 存储悬停状态，避免不必要的 React 重渲染。
 *
 * @param components 元件列表
 * @param config 碰撞检测配置
 * @returns 端子检测方法和状态
 */
export function useTerminalHitTest(
  components: WiringComponent[],
  config: HitTestConfig = {}
): UseTerminalHitTestReturn {
  const {
    clickThreshold = 20,
    hoverThreshold = 20,
    cellSize = 50
  } = config;

  // 创建空间哈希网格
  const spatialGrid = useMemo(() => createSpatialHashGrid<Terminal>(cellSize), [cellSize]);

  // 端子 ID 到端子对象的映射
  const terminalMap = useMemo(() => {
    const map = new Map<string, Terminal>();
    for (const comp of components) {
      for (const terminal of comp.terminals) {
        map.set(terminal.id, terminal);
      }
    }
    return map;
  }, [components]);

  // 初始化空间哈希网格
  useEffect(() => {
    spatialGrid.clear();
    for (const comp of components) {
      for (const terminal of comp.terminals) {
        spatialGrid.insert(terminal);
      }
    }
  }, [components, spatialGrid]);

  // 当前悬停的端子（使用 Ref 避免触发重渲染）
  const hoveredTerminal = useRef<string | null>(null);

  /**
   * 查找指定位置的端子
   */
  const findTerminalAt = useCallback(
    (x: number, y: number, radius: number = clickThreshold): Terminal | null => {
      return spatialGrid.findNearest(x, y, radius);
    },
    [spatialGrid, clickThreshold]
  );

  /**
   * 检查是否悬停在端子上
   */
  const checkHover = useCallback(
    (x: number, y: number): Terminal | null => {
      const terminal = findTerminalAt(x, y, hoverThreshold);
      hoveredTerminal.current = terminal?.id || null;
      return terminal;
    },
    [findTerminalAt, hoverThreshold]
  );

  /**
   * 根据端子 ID 查找端子对象
   */
  const findTerminalById = useCallback(
    (terminalId: string): Terminal | null => {
      return terminalMap.get(terminalId) || null;
    },
    [terminalMap]
  );

  /**
   * 获取所有端子列表
   */
  const getAllTerminals = useCallback((): Terminal[] => {
    return Array.from(terminalMap.values());
  }, [terminalMap]);

  return {
    findTerminalAt,
    checkHover,
    hoveredTerminal,
    findTerminalById,
    getAllTerminals,
    spatialGrid
  };
}
