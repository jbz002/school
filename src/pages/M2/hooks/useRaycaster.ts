import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { ElectricalComponent } from '../types';

interface UseRaycasterParams {
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  objects: Map<string, THREE.Mesh>;
  onComponentClick?: (componentId: string) => void;
  onComponentHover?: (componentId: string | null) => void;
  enabled?: boolean;
}

/**
 * Raycaster 交互 Hook
 * 处理鼠标悬停和点击事件
 */
export function useRaycaster(params: UseRaycasterParams): void {
  const {
    camera,
    scene,
    renderer,
    objects,
    onComponentClick,
    onComponentHover,
    enabled = true
  } = params;

  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !camera || !scene || !renderer || objects.size === 0) return;

    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;

    // 获取可交互的元件列表
    const interactableObjects = Array.from(objects.values());

    /**
     * 处理鼠标移动 - 悬停检测
     */
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();

      // 将鼠标坐标转换为标准化设备坐标 (-1 到 +1)
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 更新射线
      raycaster.setFromCamera(mouse, camera);

      // 检测相交对象
      const intersects = raycaster.intersectObjects(interactableObjects, false);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object as THREE.Mesh;
        const componentId = intersectedObject.userData.componentId as string;

        // 更新鼠标样式
        renderer.domElement.style.cursor = 'pointer';

        // 触发悬停回调
        if (componentId !== hoveredIdRef.current) {
          hoveredIdRef.current = componentId;
          onComponentHover?.(componentId);
        }
      } else {
        // 恢复鼠标样式
        renderer.domElement.style.cursor = 'default';

        // 清除悬停状态
        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          onComponentHover?.(null);
        }
      }
    };

    /**
     * 处理点击事件
     */
    const handleClick = (event: MouseEvent) => {
      // 只响应左键点击
      if (event.button !== 0) return;

      const rect = renderer.domElement.getBoundingClientRect();

      // 计算鼠标位置
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 更新射线
      raycaster.setFromCamera(mouse, camera);

      // 检测相交
      const intersects = raycaster.intersectObjects(interactableObjects, false);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object as THREE.Mesh;
        const componentId = intersectedObject.userData.componentId as string;

        // 触发点击回调
        onComponentClick?.(componentId);
      }
    };

    // 添加事件监听
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // 清理函数
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, scene, renderer, objects, onComponentClick, onComponentHover, enabled]);
}

/**
 * 为组件提供简化的 Raycaster 集成
 * 这个版本直接在 useThreeScene 内部使用
 */
export interface RaycasterIntegrationParams {
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  objects: Map<string, THREE.Mesh>;
  onComponentClick: (component: ElectricalComponent) => void;
  components: ElectricalComponent[];
}

export function useRaycasterIntegration(params: RaycasterIntegrationParams): void {
  const { camera, scene, renderer, objects, onComponentClick, components } = params;

  useEffect(() => {
    if (!camera || !scene || !renderer || objects.size === 0) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const interactableObjects = Array.from(objects.values());

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactableObjects, false);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object as THREE.Mesh;
        const componentId = intersectedObject.userData.componentId as string;
        const component = components.find(c => c.id === componentId);

        if (component) {
          onComponentClick(component);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactableObjects, false);

      renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, scene, renderer, objects, onComponentClick, components]);
}
