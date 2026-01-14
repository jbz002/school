import { useMemo, useCallback } from 'react';
import type { WireConnection, WiringRule } from '../types';

interface UseConnectionRulesReturn {
  isValid: boolean;
  errors: Array<{ message: string; suggestion: string }>;
  warnings: Array<{ message: string }>;
  completedRules: WiringRule[];
  progress: number;
  validateConnection: (connection: WireConnection) => { isValid: boolean; error?: string };
}

/**
 * 连接规则验证 Hook
 * 验证接线是否符合规则，检测违规连接
 */
export function useConnectionRules(
  connections: WireConnection[],
  rules: WiringRule[]
): UseConnectionRulesReturn {
  const validation = useMemo(() => {
    const errors: Array<{ message: string; suggestion: string }> = [];
    const warnings: Array<{ message: string }> = [];
    const completedRules: WiringRule[] = [];

    // 检查每个规则
    rules.forEach(rule => {
      const { connections: requiredConnections, forbidden } = rule;

      // 检查必需连接
      const hasAllRequired = requiredConnections.every(req => {
        return connections.some(conn =>
          conn.from.id === req.from && conn.to.id === req.to
        );
      });

      if (hasAllRequired) {
        completedRules.push(rule);
      }

      // 检查禁止连接
      forbidden.forEach(forbidden => {
        const hasForbidden = connections.some(conn =>
          conn.from.id === forbidden.from && conn.to.id === forbidden.to
        );

        if (hasForbidden) {
          errors.push({
            message: `禁止连接：${forbidden.from} → ${forbidden.to}`,
            suggestion: forbidden.reason
          });
        }
      });
    });

    // 检查短路（同一输出端连接到多个输入端）
    const outputTerminals = new Map<string, string[]>();
    connections.forEach(conn => {
      const fromId = conn.from.id;
      if (!outputTerminals.has(fromId)) {
        outputTerminals.set(fromId, []);
      }
      outputTerminals.get(fromId)!.push(conn.to.id);
    });

    outputTerminals.forEach((targets, fromId) => {
      if (targets.length > 1) {
        warnings.push({
          message: `端子 ${fromId} 连接到多个端子，可能存在短路风险`
        });
      }
    });

    // 计算进度
    const progress = rules.length > 0 ? Math.round((completedRules.length / rules.length) * 100) : 0;

    // 检查是否有效
    const isValid = completedRules.length === rules.length && errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      completedRules,
      progress
    };
  }, [connections, rules]);

  /**
   * 验证单个连接
   */
  const validateConnection = useCallback((connection: WireConnection): { isValid: boolean; error?: string } => {
    // 检查禁止连接
    for (const rule of rules) {
      const forbidden = rule.forbidden.find(f =>
        f.from === connection.from.id && f.to === connection.to.id
      );

      if (forbidden) {
        return {
          isValid: false,
          error: forbidden.reason
        };
      }
    }

    return { isValid: true };
  }, [rules]);

  return {
    ...validation,
    validateConnection
  };
}

/**
 * 规则验证工具函数
 */
export function validateConnection(
  connection: WireConnection,
  rules: WiringRule[]
): { isValid: boolean; error?: string } {
  // 检查禁止连接
  for (const rule of rules) {
    const forbidden = rule.forbidden.find(f =>
      f.from === connection.from.id && f.to === connection.to.id
    );

    if (forbidden) {
      return {
        isValid: false,
        error: forbidden.reason
      };
    }
  }

  return { isValid: true };
}

/**
 * 检查短路
 */
export function checkShortCircuit(connections: WireConnection[]): boolean {
  const connectionMap = new Map<string, string[]>();

  connections.forEach(conn => {
    const key = conn.from.id;
    if (!connectionMap.has(key)) {
      connectionMap.set(key, []);
    }
    connectionMap.get(key)!.push(conn.to.id);
  });

  // 如果有多个输出连接到同一个输入，可能存在短路
  for (const [_, targets] of connectionMap) {
    const uniqueTargets = new Set(targets);
    if (uniqueTargets.size < targets.length) {
      return true;
    }
  }

  return false;
}
