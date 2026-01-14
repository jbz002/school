import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ElectricalComponent } from '../types';
import {
  setupScene,
  createCamera,
  createRenderer,
  createComponentMesh,
  updateHighlight,
  createConveyorBelt
} from '../utils/sceneBuilder';

interface UseThreeSceneParams {
  containerRef: React.RefObject<HTMLDivElement>;
  components: ElectricalComponent[];
  onComponentClick: (component: ElectricalComponent) => void;
  highlightedId: string | null;
}

interface UseThreeSceneReturn {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  objects: Map<string, THREE.Mesh>;
}

/**
 * Three.js 场景管理 Hook
 * 负责初始化场景、渲染循环、事件处理
 */
export function useThreeScene(params: UseThreeSceneParams): UseThreeSceneReturn {
  const { containerRef, components, highlightedId } = params;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number>();

  const [objects, setObjects] = useState<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f5ff); // 浅蓝紫色背景
    sceneRef.current = scene;

    // 2. 设置场景环境（灯光、网格等）
    setupScene(scene);

    // 3. 添加装饰性传送带
    const conveyorBelt = createConveyorBelt();
    scene.add(conveyorBelt);

    // 4. 创建相机
    const camera = createCamera(container.clientWidth / container.clientHeight);
    scene.add(camera);
    cameraRef.current = camera;

    // 5. 创建渲染器
    const renderer = createRenderer(container);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 6. 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2; // 限制不能转到地面以下
    controlsRef.current = controls;

    // 7. 渲染循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. 窗口大小变化处理
    const handleResize = () => {
      if (!container || !camera || !renderer) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  // 当组件数据变化时，更新场景中的元件
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 清除旧元件
    objectsRef.current.forEach(mesh => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    objectsRef.current.clear();

    // 添加新元件
    components.forEach(component => {
      const mesh = createComponentMesh(component);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objectsRef.current.set(component.id, mesh);
    });

    setObjects(new Map(objectsRef.current));
  }, [components]);

  // 当高亮 ID 变化时，更新高亮效果
  useEffect(() => {
    updateHighlight(objectsRef.current, highlightedId);
  }, [highlightedId]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    objects
  };
}
