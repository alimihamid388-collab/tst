import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Hotspot, Question } from '../../types/database';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Play,
  Pause,
  HelpCircle,
  Info,
  Check,
  Crosshair,
} from 'lucide-react';

interface PanoramaViewerProps {
  panoramaUrl: string;
  stageTitle?: string;
  stageDescription?: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
  // Admin placement mode
  placementMode?: boolean;
  onSphereClick?: (coords: { x: number; y: number; z: number }) => void;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
  // Progress indicators
  answeredQuestionsCount?: number;
  totalQuestionsCount?: number;
  isAnsweredCorrectly?: (hotspotId: string) => boolean;
  // Story-driven seamless transition
  isTransitioning?: boolean;
  transitionMessage?: string;
}

interface ProjectedHotspot {
  hotspot: Hotspot;
  screenX: number;
  screenY: number;
  isVisible: boolean;
  isCorrect: boolean;
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  panoramaUrl,
  stageTitle,
  stageDescription,
  hotspots = [],
  onHotspotClick,
  placementMode = false,
  onSphereClick,
  initialYaw = 0,
  initialPitch = 0,
  initialFov = 75,
  answeredQuestionsCount = 0,
  totalQuestionsCount = 5,
  isAnsweredCorrectly,
  isTransitioning = false,
  transitionMessage = 'در حال انتقال به فضای بعدی...',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Interaction State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isLoadingTexture, setIsLoadingTexture] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [lastPlacedPoint, setLastPlacedPoint] = useState<{ x: number; y: number; z: number } | null>(null);

  // Rotation angles (degrees)
  const isUserInteracting = useRef(false);
  const onPointerDownPointerX = useRef(0);
  const onPointerDownPointerY = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);
  const lon = useRef(initialYaw);
  const lat = useRef(initialPitch);
  const targetLon = useRef(initialYaw);
  const targetLat = useRef(initialPitch);
  const fov = useRef(initialFov);

  // Touch pinch zoom state
  const touchDistanceRef = useRef<number | null>(null);

  // Reset or initial position updates
  useEffect(() => {
    lon.current = initialYaw;
    lat.current = initialPitch;
    targetLon.current = initialYaw;
    targetLat.current = initialPitch;
    fov.current = initialFov;
    if (cameraRef.current) {
      cameraRef.current.fov = initialFov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [initialYaw, initialPitch, initialFov, panoramaUrl]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: placed at (0, 0, 0)
    const camera = new THREE.PerspectiveCamera(fov.current, width / height, 1, 1100);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current || undefined,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // 4. Sphere geometry: radius 500, flipped inside
    const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
    // Invert the geometry on the x-axis so that all faces face inward
    sphereGeo.scale(-1, 1, 1);

    // Initial placeholder material
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x11161d,
      side: THREE.FrontSide, // Already scaled -1, so FrontSide points inward
    });

    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // Texture Loader
    textureLoaderRef.current = new THREE.TextureLoader();

    // 5. Render Loop with projected hotspots update
    const render = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const cam = cameraRef.current;

      // Auto-rotation when enabled
      if (autoRotate && !isUserInteracting.current) {
        targetLon.current += 0.08;
      }

      // Smooth damping / interpolation
      lon.current += (targetLon.current - lon.current) * 0.15;
      lat.current += (targetLat.current - lat.current) * 0.15;

      // Clamp latitude to prevent gimbal flip
      lat.current = Math.max(-85, Math.min(85, lat.current));
      targetLat.current = Math.max(-85, Math.min(85, targetLat.current));

      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      cam.lookAt(targetX, targetY, targetZ);

      rendererRef.current.render(sceneRef.current, cam);

      // Project hotspots onto 2D viewport
      updateHotspotProjections();

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, []);

  // Update Hotspot 2D Projections
  const updateHotspotProjections = useCallback(() => {
    if (!cameraRef.current || !containerRef.current || hotspots.length === 0) {
      if (projectedHotspots.length > 0) setProjectedHotspots([]);
      return;
    }

    const cam = cameraRef.current;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const camForward = new THREE.Vector3();
    cam.getWorldDirection(camForward);

    const projected: ProjectedHotspot[] = hotspots.map((spot) => {
      const pos = new THREE.Vector3(spot.pos_x, spot.pos_y, spot.pos_z);
      // Check if the hotspot is in front of the camera (within ~170 degree hemisphere)
      const dot = pos.clone().normalize().dot(camForward);
      const isVisible = dot > 0.1; // Only show when visible in front field of view

      const projectedVec = pos.clone().project(cam);
      const screenX = (projectedVec.x * 0.5 + 0.5) * w;
      const screenY = (-(projectedVec.y * 0.5) + 0.5) * h;

      const isCorrect = isAnsweredCorrectly ? isAnsweredCorrectly(spot.id) : false;

      return {
        hotspot: spot,
        screenX,
        screenY,
        isVisible,
        isCorrect,
      };
    });

    setProjectedHotspots(projected);
  }, [hotspots, isAnsweredCorrectly]);

  // Load Panorama Texture
  useEffect(() => {
    if (!sphereMeshRef.current || !panoramaUrl) return;

    setIsLoadingTexture(true);
    setLoadError(null);

    const loader = textureLoaderRef.current || new THREE.TextureLoader();

    loader.load(
      panoramaUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        if (sphereMeshRef.current) {
          const mat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
          });
          sphereMeshRef.current.material = mat;
        }
        setIsLoadingTexture(false);
      },
      undefined,
      (err) => {
        console.error('Panorama texture load error:', err);
        setLoadError('خطا در بارگذاری تصویر ۳۶۰ درجه. لطفاً دوباره تلاش کنید.');
        setIsLoadingTexture(false);
      }
    );
  }, [panoramaUrl]);

  // Pointer & Touch Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isUserInteracting.current = true;
    onPointerDownPointerX.current = e.clientX;
    onPointerDownPointerY.current = e.clientY;
    onPointerDownLon.current = targetLon.current;
    onPointerDownLat.current = targetLat.current;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isUserInteracting.current) return;

    const factor = fov.current / 450; // Slower drag when zoomed in
    const deltaX = (e.clientX - onPointerDownPointerX.current) * factor;
    const deltaY = (e.clientY - onPointerDownPointerY.current) * factor;

    targetLon.current = onPointerDownLon.current - deltaX;
    targetLat.current = onPointerDownLat.current + deltaY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isUserInteracting.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.05;
    const newFov = THREE.MathUtils.clamp(fov.current + zoomDelta, 35, 100);
    fov.current = newFov;

    if (cameraRef.current) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // Touch Pinch Zoom Handlers
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);

      if (touchDistanceRef.current !== null) {
        const delta = (touchDistanceRef.current - distance) * 0.15;
        const newFov = THREE.MathUtils.clamp(fov.current + delta, 35, 100);
        fov.current = newFov;
        if (cameraRef.current) {
          cameraRef.current.fov = newFov;
          cameraRef.current.updateProjectionMatrix();
        }
      }
      touchDistanceRef.current = distance;
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  // Admin Raycasting for 3D Hotspot Placement
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!placementMode || !onSphereClick) return;

    // Check if mouse actually moved much (if dragged, don't place)
    const dist = Math.hypot(
      e.clientX - onPointerDownPointerX.current,
      e.clientY - onPointerDownPointerY.current
    );
    if (dist > 8) return;

    if (!containerRef.current || !cameraRef.current || !sphereMeshRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObject(sphereMeshRef.current);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      // Normalise distance to ~450 radius for consistent hotspot placement
      const normalized = point.clone().normalize().multiplyScalar(440);
      const coords = {
        x: Math.round(normalized.x),
        y: Math.round(normalized.y),
        z: Math.round(normalized.z),
      };
      setLastPlacedPoint(coords);
      onSphereClick(coords);
    }
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -15 : 15;
    const newFov = THREE.MathUtils.clamp(fov.current + delta, 35, 100);
    fov.current = newFov;
    if (cameraRef.current) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleResetView = () => {
    targetLon.current = initialYaw;
    targetLat.current = initialPitch;
    fov.current = initialFov;
    if (cameraRef.current) {
      cameraRef.current.fov = initialFov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden bg-[#0a0d11] ${
        placementMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleContainerClick}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Loading Overlay */}
      {isLoadingTexture && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]/85 backdrop-blur-md text-white transition-opacity duration-300">
          <div className="w-12 h-12 border-3 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium tracking-wide text-slate-200">
            در حال بارگذاری محیط ۳۶۰ درجه...
          </p>
          <span className="text-xs text-slate-400 mt-1">کیفیت Equirectangular 4K</span>
        </div>
      )}

      {/* Seamless Story Transition Overlay */}
      <div
        className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-black transition-opacity duration-700 pointer-events-none ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-md text-center p-6 space-y-3">
          <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white tracking-wide">{stageTitle}</h3>
          <p className="text-xs text-teal-300 leading-relaxed font-medium">{transitionMessage}</p>
        </div>
      </div>

      {/* Error State */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]/90 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
            !
          </div>
          <p className="text-sm font-semibold text-rose-300 mb-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-white border border-white/10"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Placement Mode Banner */}
      {placementMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-amber-500/90 text-slate-950 font-medium text-xs rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 border border-amber-300 pointer-events-none">
          <Crosshair className="w-4 h-4 animate-spin text-slate-950" />
          <span>حالت جانمایی: روی هر نقطه از تصویر ۳۶۰ کلیک کنید تا نقطه تعاملی ایجاد شود</span>
        </div>
      )}

      {/* 2D Projected Hotspot Pins */}
      {!isLoadingTexture &&
        projectedHotspots.map(({ hotspot, screenX, screenY, isVisible, isCorrect }) => {
          if (!isVisible) return null;

          const isQuestion = hotspot.hotspot_type === 'question';

          return (
            <div
              key={hotspot.id}
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 pointer-events-auto group"
              onClick={(e) => {
                e.stopPropagation();
                if (!placementMode && onHotspotClick) {
                  onHotspotClick(hotspot);
                }
              }}
              onMouseEnter={() => setActiveTooltipId(hotspot.id)}
              onMouseLeave={() => setActiveTooltipId(null)}
            >
              {/* Hotspot Pin Icon */}
              <button
                type="button"
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-2xl ${
                  isQuestion
                    ? isCorrect
                      ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-emerald-500/50'
                      : 'bg-amber-500 text-slate-950 border-2 border-amber-200 hotspot-glow-gold'
                    : 'bg-teal-600 text-white border-2 border-teal-300 hotspot-glow-teal'
                }`}
                title={hotspot.title}
                aria-label={hotspot.title}
              >
                {isQuestion ? (
                  isCorrect ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span className="font-bold text-lg select-none">؟</span>
                  )
                ) : (
                  <Info className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>

              {/* Tooltip Card on Hover */}
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg glass-panel-card text-right shadow-2xl transition-all duration-150 pointer-events-none ${
                  activeTooltipId === hotspot.id
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-2 scale-95'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1 border-b border-white/10 pb-1">
                  <span>{isQuestion ? 'سؤال آزمون' : 'اطلاعات معماری'}</span>
                  {isQuestion && (
                    <span className={isCorrect ? 'text-emerald-400' : 'text-amber-400'}>
                      {isCorrect ? 'پاسخ داده شد ✓' : 'پاسخ داده نشده'}
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-white line-clamp-2">{hotspot.title}</div>
                <div className="text-[10px] text-teal-400 mt-1 font-sans">کلیک جهت مشاهده</div>
              </div>
            </div>
          );
        })}

      {/* Top HUD: Stage info & Progress Badge */}
      <div className="absolute top-4 right-4 z-20 max-w-sm pointer-events-none">
        <div className="glass-panel rounded-xl p-3 shadow-xl border border-white/10 text-right backdrop-blur-md">
          {stageTitle && (
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center justify-end gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block"></span>
              {stageTitle}
            </h2>
          )}
          {stageDescription && (
            <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {stageDescription}
            </p>
          )}

          {/* Quiz Stage Counter */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span className="text-slate-400">پیشرفت آزمون:</span>
              <span className="text-teal-400 font-bold tabular-nums">
                {answeredQuestionsCount} / {totalQuestionsCount}
              </span>
            </div>

            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                answeredQuestionsCount >= totalQuestionsCount
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-300'
              }`}
            >
              {answeredQuestionsCount >= totalQuestionsCount ? 'آزمون تکمیل شد' : 'در حال اجرا'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation / Controls HUD */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl shadow-2xl border border-white/10 backdrop-blur-lg">
        {/* Reset View */}
        <button
          onClick={handleResetView}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="تنظیم مجدد زاویه دید"
          aria-label="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="بزرگ‌نمایی"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="کوچک‌نمایی"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-white/10 mx-1" />

        {/* Auto Rotate Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2.5 rounded-xl transition-colors ${
            autoRotate
              ? 'bg-teal-500/30 text-teal-300 border border-teal-500/40'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title={autoRotate ? 'توقف چرخش خودکار' : 'شروع چرخش خودکار'}
          aria-label="Toggle Auto Rotate"
        >
          {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Hint Floating Pill */}
      <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black/50 text-[10px] text-slate-300 rounded-full backdrop-blur-sm pointer-events-none">
        جهت گردش انگشت خود را بکشید · برای زوم دو انگشت را باز کنید
      </div>
    </div>
  );
};
