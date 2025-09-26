import { useState, useRef, useEffect } from 'react';

export const useDragAndDrop = () => {
  const [draggedImage, setDraggedImage] = useState(null);
  const [droppedImages, setDroppedImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);

  // session refs to avoid stale closures
  const movingRef = useRef(null);   // { id, grabOffset:{dx,dy} }
  const resizingRef = useRef(null); // { id, type:'corner'|'side', edge|corner, center, startSize:{w,h} }
  const animationFrameRef = useRef(null); // For smooth resizing

  /** ===== Utils ===== **/
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect();
  const MIN_W = 40, MIN_H = 30;

  const clampCenter = (center, size) => {
    const rect = getCanvasRect();
    if (!rect) return center;
    const halfW = size.w / 2, halfH = size.h / 2;
    const minX = halfW, maxX = rect.width - halfW;
    const minY = halfH, maxY = rect.height - halfH;
    return {
      x: Math.min(Math.max(center.x, minX), Math.max(minX, maxX)),
      y: Math.min(Math.max(center.y, minY), Math.max(minY, maxY)),
    };
  };

  const clampSizeFreeform = (center, size) => {
    let w = size.w;
    let h = size.h;
    w = Math.max(w, MIN_W);
    h = Math.max(h, MIN_H);
    const rect = getCanvasRect();
    if (rect) {
      const maxW = 2 * Math.min(center.x, rect.width - center.x);
      const maxH = 2 * Math.min(center.y, rect.height - center.y);
      w = Math.min(w, Math.floor(maxW));
      h = Math.min(h, Math.floor(maxH));
    }
    return { w, h };
  };

  /** ===== Drag from sources ===== **/
  // const handleDragStart = (e, imageData) => {
  //   setDraggedImage(imageData);
  //   e.dataTransfer.effectAllowed = 'move';
  // };
  // replace your current handleDragStart with this:
  const handleDragStart = (e, imageData) => {
    setDraggedImage(imageData);              // keep (helps VideoWall in App)
    e.dataTransfer.effectAllowed = 'move';
    // NEW: also stash payload in dataTransfer so OTHER canvases can read it
    e.dataTransfer.setData('application/x-drag-image', JSON.stringify(imageData));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const readNaturalSize = (src) =>
    new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 });
      im.onerror = () => resolve({ w: 640, h: 360 }); // fallback
      im.src = src;
    });

  // const handleDrop = async (e) => {
  //   e.preventDefault();
  //   if (!draggedImage) return;
    
  //   // Check if maximum 4 images limit is reached
  //   if (droppedImages.length >= 4) {
  //     alert("Maximum 4 images allowed on the video wall. Please remove an image before adding a new one.");
  //     setDraggedImage(null);
  //     return;
  //   }
    
  //   const rect = getCanvasRect();
  //   if (!rect) return;

  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;

  //   const nat = await readNaturalSize(draggedImage.src);
  //   const aspect = nat.w / nat.h;

  //   let initW = Math.min(160, nat.w);
  //   let initH = Math.round(initW / aspect);
  //   if (initH > nat.h) {
  //     initH = Math.min(100, nat.h);
  //     initW = Math.round(initH * aspect);
  //   }

  //   const center = clampCenter({ x, y }, { w: initW, h: initH });
  //   const newImage = {
  //     ...draggedImage,
  //     id: Date.now(),
  //     position: center,
  //     size: { w: initW, h: initH },
  //     aspect,
  //     nat,
  //     name: draggedImage.name,
  //   };

  //   setDroppedImages((prev) => [...prev, newImage]);
  //   setDraggedImage(null);
  //   setSelectedId(newImage.id);
  // };
  const handleDrop = async (e) => {
    e.preventDefault();
  
    // NEW: try to read payload from dataTransfer (works across components)
    let payload = draggedImage;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/x-drag-image');
        if (raw) payload = JSON.parse(raw);
      } catch (_) {}
    }
    if (!payload) return;
  
    // OPTIONAL: per-canvas limit (leave your alert text as-is or customize)
    if (droppedImages.length >= 4) {
      alert("Maximum 4 images allowed on the video wall. Please remove an image before adding a new one.");
      setDraggedImage(null);
      return;
    }
  
    const rect = getCanvasRect();
    if (!rect) return;
  
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    const nat = await readNaturalSize(payload.src);
    const aspect = nat.w / nat.h;
  
    let initW = Math.min(160, nat.w);
    let initH = Math.round(initW / aspect);
    if (initH > nat.h) {
      initH = Math.min(100, nat.h);
      initW = Math.round(initH * aspect);
    }
  
    const center = clampCenter({ x, y }, { w: initW, h: initH });
    const newImage = {
      ...payload,
      id: Date.now(),
      position: center,
      size: { w: initW, h: initH },
      aspect,
      nat,
      name: payload.name,
    };
  
    setDroppedImages((prev) => [...prev, newImage]);
    setDraggedImage(null);
    setSelectedId(newImage.id);
  };

  


  
  /** ===== Move ===== **/
  const startMove = (e, id) => {
    e.stopPropagation();
    const rect = getCanvasRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    movingRef.current = { id, grabOffset: { dx: px - img.position.x, dy: py - img.position.y } };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endMove);
  };

  const onMove = (e) => {
    const moving = movingRef.current;
    if (!moving) return;
    const rect = getCanvasRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setDroppedImages((prev) =>
      prev.map((img) => {
        if (img.id !== moving.id) return img;
        const center = { x: px - moving.grabOffset.dx, y: py - moving.grabOffset.dy };
        const clampedCenter = clampCenter(center, img.size);
        return { ...img, position: clampedCenter };
      })
    );
  };

  const endMove = () => {
    movingRef.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endMove);
  };

  /** ===== Resize (corners + sides, free-form like Paint) ===== **/
  const startResizeCorner = (e, id, corner) => {
    e.preventDefault(); e.stopPropagation();
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    resizingRef.current = {
      id,
      type: 'corner',
      corner, // 'nw'|'ne'|'sw'|'se'
      center: { ...img.position },
      startSize: { ...img.size },
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', endResize);
  };

  const startResizeSide = (e, id, edge) => {
    e.preventDefault(); e.stopPropagation();
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    resizingRef.current = {
      id,
      type: 'side',
      edge, // 'n'|'s'|'e'|'w'
      center: { ...img.position },
      startSize: { ...img.size },
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', endResize);
  };

  const onResizeMove = (e) => {
    const s = resizingRef.current;
    if (!s) return;
    
    // Cancel previous animation frame for smooth performance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use requestAnimationFrame for smooth resizing
    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = getCanvasRect();
      if (!rect) return;
      
      // Get mouse position relative to canvas with precision
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Clamp mouse position to canvas bounds with padding
      const padding = 2; // Small padding to prevent edge cases
      const clampedMouseX = Math.max(padding, Math.min(mouseX, rect.width - padding));
      const clampedMouseY = Math.max(padding, Math.min(mouseY, rect.height - padding));

      setDroppedImages((prev) =>
        prev.map((img) => {
          if (img.id !== s.id) return img;

          // Get initial edges from start position
          const startLeft = s.center.x - s.startSize.w / 2;
          const startRight = s.center.x + s.startSize.w / 2;
          const startTop = s.center.y - s.startSize.h / 2;
          const startBottom = s.center.y + s.startSize.h / 2;

          let newLeft = startLeft;
          let newRight = startRight;
          let newTop = startTop;
          let newBottom = startBottom;

          if (s.type === 'corner') {
            // Professional corner resizing with proper edge handling
            switch (s.corner) {
              case 'se': // Southeast: drag bottom-right corner
                newRight = clampedMouseX;
                newBottom = clampedMouseY;
                break;
              case 'sw': // Southwest: drag bottom-left corner
                newLeft = clampedMouseX;
                newBottom = clampedMouseY;
                break;
              case 'ne': // Northeast: drag top-right corner
                newRight = clampedMouseX;
                newTop = clampedMouseY;
                break;
              case 'nw': // Northwest: drag top-left corner
                newLeft = clampedMouseX;
                newTop = clampedMouseY;
                break;
            }
          } else {
            // Professional side resizing with single-axis movement
            switch (s.edge) {
              case 'e': // East: drag right edge
                newRight = clampedMouseX;
                break;
              case 'w': // West: drag left edge
                newLeft = clampedMouseX;
                break;
              case 's': // South: drag bottom edge
                newBottom = clampedMouseY;
                break;
              case 'n': // North: drag top edge
                newTop = clampedMouseY;
                break;
            }
          }

          // Ensure minimum size constraints with smooth scaling
          const newWidth = Math.max(MIN_W, Math.round(newRight - newLeft));
          const newHeight = Math.max(MIN_H, Math.round(newBottom - newTop));

          // Calculate new center position with precision
          const newCenterX = (newLeft + newRight) / 2;
          const newCenterY = (newTop + newBottom) / 2;

          // Apply canvas boundary constraints with smooth clamping
          const halfWidth = newWidth / 2;
          const halfHeight = newHeight / 2;
          
          const constrainedCenterX = Math.max(
            halfWidth, 
            Math.min(newCenterX, rect.width - halfWidth)
          );
          const constrainedCenterY = Math.max(
            halfHeight, 
            Math.min(newCenterY, rect.height - halfHeight)
          );

          return {
            ...img,
            position: { x: constrainedCenterX, y: constrainedCenterY },
            size: { w: newWidth, h: newHeight }
          };
        })
      );
    });
  };

  const endResize = () => {
    // Clean up animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    resizingRef.current = null;
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', endResize);
  };

  /** ===== Selection + Delete (keyboard) ===== **/
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setDroppedImages((prev) => prev.filter((img) => img.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  useEffect(() => {
    return () => {
      // Clean up all event listeners
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endMove);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', endResize);
      
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    draggedImage,
    droppedImages,
    selectedId,
    canvasRef,
    setDroppedImages,
    setSelectedId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    startMove,
    startResizeCorner,
    startResizeSide,
  };
};
