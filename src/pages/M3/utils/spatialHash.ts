/**
 * 空间哈希网格（Spatial Hash Grid）
 *
 * 用于优化 2D 空间中的碰撞检测，将 O(n) 的遍历复杂度降低到接近 O(1)。
 *
 * 原理：
 * 1. 将画布划分为固定大小的网格单元（cell）
 * 2. 每个对象根据其坐标注册到对应的网格单元中
 * 3. 查询时只检查周围 3x3 网格内的对象，而不是遍历所有对象
 *
 * 适用场景：
 * - 端子碰撞检测（鼠标位置查找附近的端子）
 * - 大量静态对象的位置查询
 */

/**
 * 2D 点坐标
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 空间索引对象接口
 * 对象必须有唯一 ID 和位置信息
 */
export interface SpatialObject {
  id: string;
  position: Point;
}

/**
 * 空间哈希网格类
 */
export class SpatialHashGrid<T extends SpatialObject> {
  private cellSize: number;
  private grid: Map<string, T[]> = new Map();
  private objectToCell: Map<string, string> = new Map();

  /**
   * 创建空间哈希网格
   * @param cellSize 网格单元大小（像素），默认 50
   */
  constructor(cellSize: number = 50) {
    this.cellSize = cellSize;
  }

  /**
   * 计算对象所在的网格单元键
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * 获取指定位置周围的所有网格单元键（3x3 区域）
   */
  private getNearbyCellKeys(x: number, y: number, radius: number): string[] {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);

    // 计算需要检查的网格范围（考虑半径）
    const cellRadius = Math.ceil(radius / this.cellSize);

    const keys: string[] = [];
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        keys.push(`${cellX + dx},${cellY + dy}`);
      }
    }

    return keys;
  }

  /**
   * 插入对象到网格中
   * @param obj 要插入的对象
   */
  insert(obj: T): void {
    // 如果对象已存在，先移除
    if (this.objectToCell.has(obj.id)) {
      this.remove(obj.id);
    }

    const key = this.getCellKey(obj.position.x, obj.position.y);

    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }

    this.grid.get(key)!.push(obj);
    this.objectToCell.set(obj.id, key);
  }

  /**
   * 从网格中移除对象
   * @param id 对象 ID
   */
  remove(id: string): void {
    const cellKey = this.objectToCell.get(id);
    if (!cellKey) {
      return;
    }

    const cell = this.grid.get(cellKey);
    if (cell) {
      const index = cell.findIndex(obj => obj.id === id);
      if (index !== -1) {
        cell.splice(index, 1);
      }

      // 如果网格单元为空，删除它
      if (cell.length === 0) {
        this.grid.delete(cellKey);
      }
    }

    this.objectToCell.delete(id);
  }

  /**
   * 查询指定位置和半径内的所有对象
   * @param x 查询中心 X 坐标
   * @param y 查询中心 Y 坐标
   * @param radius 查询半径
   * @returns 在半径内的对象列表
   */
  query(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const nearbyKeys = this.getNearbyCellKeys(x, y, radius);
    const radiusSquared = radius * radius;

    for (const key of nearbyKeys) {
      const cell = this.grid.get(key);
      if (!cell) {
        continue;
      }

      for (const obj of cell) {
        // 使用距离平方比较，避免 Math.sqrt 开方运算
        const dx = obj.position.x - x;
        const dy = obj.position.y - y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= radiusSquared) {
          results.push(obj);
        }
      }
    }

    return results;
  }

  /**
   * 查询指定位置最近的单个对象
   * @param x 查询中心 X 坐标
   * @param y 查询中心 Y 坐标
   * @param radius 查询半径
   * @returns 最近的对象，如果没有则返回 null
   */
  findNearest(x: number, y: number, radius: number): T | null {
    const candidates = this.query(x, y, radius);
    if (candidates.length === 0) {
      return null;
    }

    // 找到距离最小的对象
    let nearest: T = candidates[0];
    let minDistanceSquared = Number.MAX_VALUE;

    for (const obj of candidates) {
      const dx = obj.position.x - x;
      const dy = obj.position.y - y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        nearest = obj;
      }
    }

    return nearest;
  }

  /**
   * 更新对象位置
   * @param obj 更新后的对象
   */
  update(obj: T): void {
    const oldCellKey = this.objectToCell.get(obj.id);
    const newCellKey = this.getCellKey(obj.position.x, obj.position.y);

    // 如果对象没有移动到新的网格单元，无需更新
    if (oldCellKey === newCellKey) {
      return;
    }

    // 先移除，再插入
    this.remove(obj.id);
    this.insert(obj);
  }

  /**
   * 清空网格
   */
  clear(): void {
    this.grid.clear();
    this.objectToCell.clear();
  }

  /**
   * 批量插入对象
   * @param objects 要插入的对象数组
   */
  insertBatch(objects: T[]): void {
    for (const obj of objects) {
      this.insert(obj);
    }
  }

  /**
   * 获取网格中的对象总数
   */
  get size(): number {
    return this.objectToCell.size;
  }

  /**
   * 获取网格统计信息（用于调试）
   */
  getStats(): { totalCells: number; totalObjects: number; avgObjectsPerCell: number } {
    let totalObjects = 0;
    for (const cell of this.grid.values()) {
      totalObjects += cell.length;
    }

    return {
      totalCells: this.grid.size,
      totalObjects,
      avgObjectsPerCell: this.grid.size > 0 ? totalObjects / this.grid.size : 0
    };
  }
}

/**
 * 创建空间哈希网格的工厂函数
 * @param cellSize 网格单元大小
 * @returns 空间哈希网格实例
 */
export function createSpatialHashGrid<T extends SpatialObject>(
  cellSize: number = 50
): SpatialHashGrid<T> {
  return new SpatialHashGrid<T>(cellSize);
}
