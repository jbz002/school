/**
 * 导线路径计算工具
 *
 * 提供各种导线路径的计算方法，包括贝塞尔曲线、直线、正交线等。
 */

import type { Point } from './spatialHash';
import type { Terminal, WireConnection } from '../types';

/**
 * 导线样式类型
 */
export type WireStyle = 'straight' | 'bezier' | 'orthogonal';

/**
 * 导线路径配置
 */
export interface WirePathConfig {
  style: WireStyle;
  curveIntensity?: number; // 贝塞尔曲线强度，0-1
  orthogonalStep?: number; // 正交线步长
}

/**
 * 计算贝塞尔曲线路径（三次贝塞尔曲线）
 *
 * 使用三次贝塞尔曲线创建平滑的导线路径。
 *
 * @param from 起点
 * @param to 终点
 * @param style 水平或垂直优先
 * @param curveIntensity 曲线强度，默认 0.5
 * @returns 贝塞尔曲线的点数组 [x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2]
 */
export function calculateBezierPath(
  from: Point,
  to: Point,
  style: 'horizontal' | 'vertical' | 'auto' = 'auto',
  curveIntensity: number = 0.5
): number[] {
  // 自动判断方向
  if (style === 'auto') {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    style = dx > dy ? 'horizontal' : 'vertical';
  }

  // 计算控制点
  let cp1: Point, cp2: Point;

  if (style === 'horizontal') {
    // 水平优先：控制点在水平方向延伸
    const offsetX = (to.x - from.x) * curveIntensity;
    cp1 = { x: from.x + offsetX, y: from.y };
    cp2 = { x: to.x - offsetX, y: to.y };
  } else {
    // 垂直优先：控制点在垂直方向延伸
    const offsetY = (to.y - from.y) * curveIntensity;
    cp1 = { x: from.x, y: from.y + offsetY };
    cp2 = { x: to.x, y: to.y - offsetY };
  }

  // 返回三次贝塞尔曲线的点数组
  // Konva 的 Line 组件使用扁平数组 [x1, y1, x2, y2, ...]
  // 对于贝塞尔曲线，我们需要生成平滑的路径点
  return generateSmoothBezierPoints(from, cp1, cp2, to);
}

/**
 * 生成平滑的贝塞尔曲线点集
 *
 * 三次贝塞尔曲线公式：
 * B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
 *
 * @param p0 起点
 * @param p1 控制点1
 * @param p2 控制点2
 * @param p3 终点
 * @param segments 采样段数，默认 20
 * @returns 扁平化的点数组
 */
function generateSmoothBezierPoints(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  segments: number = 30
): number[] {
  const points: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;

    // 三次贝塞尔曲线公式
    const x = mt * mt * mt * p0.x +
              3 * mt * mt * t * p1.x +
              3 * mt * t * t * p2.x +
              t * t * t * p3.x;

    const y = mt * mt * mt * p0.y +
              3 * mt * mt * t * p1.y +
              3 * mt * t * t * p2.y +
              t * t * t * p3.y;

    points.push(x, y);
  }

  return points;
}

/**
 * 计算直线路径
 *
 * @param from 起点
 * @param to 终点
 * @returns 直线的点数组 [x1, y1, x2, y2]
 */
export function calculateStraightPath(from: Point, to: Point): number[] {
  return [from.x, from.y, to.x, to.y];
}

/**
 * 计算正交线路径（L型或Z型）
 *
 * 创建水平或垂直的正交连接线。
 *
 * @param from 起点
 * @param to 终点
 * @param step 转折点距离起点的比例，默认 0.5
 * @returns 正交线的点数组
 */
export function calculateOrthogonalPath(
  from: Point,
  to: Point,
  step: number = 0.5
): number[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // 根据方向选择转角方式
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平方向优先：先水平，再垂直
    const cornerX = from.x + dx * step;
    return [from.x, from.y, cornerX, from.y, cornerX, to.y, to.x, to.y];
  } else {
    // 垂直方向优先：先垂直，再水平
    const cornerY = from.y + dy * step;
    return [from.x, from.y, from.x, cornerY, to.x, cornerY, to.x, to.y];
  }
}

/**
 * 计算导线路径（根据样式自动选择）
 *
 * @param from 起点
 * @param to 终点
 * @param config 路径配置
 * @returns 导线路径的点数组
 */
export function calculateWirePath(
  from: Point,
  to: Point,
  config: WirePathConfig = { style: 'bezier' }
): number[] {
  switch (config.style) {
    case 'straight':
      return calculateStraightPath(from, to);
    case 'orthogonal':
      return calculateOrthogonalPath(from, to, config.orthogonalStep);
    case 'bezier':
    default:
      return calculateBezierPath(from, to, 'auto', config.curveIntensity);
  }
}

/**
 * 计算导线路径上的中点
 *
 * 用于放置删除按钮或其他标记。
 *
 * @param from 起点
 * @param to 终点
 * @param path 导线路径（可选，如果不提供则重新计算）
 * @param style 导线样式
 * @returns 中点坐标
 */
export function calculateWireMidpoint(
  from: Point,
  to: Point,
  path?: number[],
  style: WireStyle = 'bezier'
): Point {
  if (path && path.length >= 4) {
    // 从路径中获取中间点
    const midIndex = Math.floor(path.length / 4) * 2;
    return { x: path[midIndex], y: path[midIndex + 1] };
  }

  // 简单的中点计算
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };
}

/**
 * 计算导线箭头的位置和旋转角度
 *
 * @param from 起点
 * @param to 终点
 * @param path 导线路径
 * @param offset 距离终点的偏移量
 * @returns 箭头位置和旋转角度
 */
export function calculateWireArrow(
  from: Point,
  to: Point,
  path: number[],
  offset: number = 10
): { position: Point; rotation: number } {
  // 获取路径终点附近的点
  const lastX = path[path.length - 2];
  const lastY = path[path.length - 1];

  // 获取倒数第二个点（用于计算角度）
  const secondLastX = path[path.length - 4];
  const secondLastY = path[path.length - 3];

  // 计算角度（弧度）
  const angle = Math.atan2(lastY - secondLastY, lastX - secondLastX);

  // 计算箭头位置（从终点向后偏移）
  const position: Point = {
    x: lastX - Math.cos(angle) * offset,
    y: lastY - Math.sin(angle) * offset
  };

  // 转换为度数
  const rotation = angle * (180 / Math.PI);

  return { position, rotation };
}

/**
 * 创建导线路径配置（从连接对象）
 *
 * @param connection 导线连接对象
 * @param defaultConfig 默认配置
 * @returns 导线路径配置
 */
export function createWirePathConfig(
  connection: WireConnection,
  defaultConfig: Partial<WirePathConfig> = {}
): WirePathConfig {
  return {
    style: connection.style || defaultConfig.style || 'bezier',
    curveIntensity: defaultConfig.curveIntensity || 0.5,
    orthogonalStep: defaultConfig.orthogonalStep || 0.5
  };
}

/**
 * 计算导线长度（近似值）
 *
 * @param path 导线路径
 * @returns 导线长度
 */
export function calculateWireLength(path: number[]): number {
  let length = 0;
  for (let i = 2; i < path.length; i += 2) {
    const dx = path[i] - path[i - 2];
    const dy = path[i + 1] - path[i - 1];
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * 检查两条导线是否相交
 *
 * @param path1 第一条导线路径
 * @param path2 第二条导线路径
 * @returns 是否相交
 */
export function checkWireIntersection(path1: number[], path2: number[]): boolean {
  // 简化版：只检查导线段的相交
  // 完整实现需要使用线段相交算法
  for (let i = 0; i < path1.length - 2; i += 2) {
    for (let j = 0; j < path2.length - 2; j += 2) {
      if (linesIntersect(
        path1[i], path1[i + 1],
        path1[i + 2], path1[i + 3],
        path2[j], path2[j + 1],
        path2[j + 2], path2[j + 3]
      )) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 检查两条线段是否相交
 */
function linesIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    return false; // 平行
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}
