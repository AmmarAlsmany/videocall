import React from 'react';
import powerButtonIcon from '../assets/powerbutton.png';
import largeScreenIcon from '../assets/largescreen.png';
import { CornerHandle, SideHandle } from './ResizeHandles';

const VideoWall = ({ 
  canvasRef, 
  droppedImages, 
  selectedId, 
  onDragOver, 
  onDrop, 
  onPointerDown, 
  startMove, 
  startResizeCorner, 
  startResizeSide,
  setDroppedImages,
  setSelectedId
}) => {
  return (
    <div className="h-[500px] bg-white rounded-xl mb-4 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2">
          <img src={powerButtonIcon} alt="Power" className="img-fluid cursor-pointer" />
          <img src={largeScreenIcon} alt="Large Screen" className="img-fluid cursor-pointer" />
          
        </div>
        <div className="text-right">
          <h3 className="text-[#A3A5A7] text-lg font-bold">Video Wall</h3>
          <p className="text-[#A3A5A7] text-sm">Drag from sources</p>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 border border-gray-300 rounded-xl p-4 relative overflow-hidden"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPointerDown={onPointerDown}
      >
        {droppedImages.map((image, idx) => (
          <div
            key={image.id}
            onPointerDown={(e) => {
              // bring to front
              setDroppedImages((prev) => {
                const i = prev.findIndex((p) => p.id === image.id);
                if (i === -1) return prev;
                const copy = [...prev];
                const [it] = copy.splice(i, 1);
                copy.push(it);
                return copy;
              });
              setSelectedId(image.id);
              startMove(e, image.id);
            }}
            className="absolute rounded-lg overflow-hidden group"
            style={{
              left: `${image.position.x}px`,
              top: `${image.position.y}px`,
              width: `${image.size.w}px`,
              height: `${image.size.h}px`,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
              zIndex: idx + 1,
            }}
          >
            {/* Remove (X) button — show on hover */}
            <button
              type="button"
              aria-label="Remove"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDroppedImages((prev) => prev.filter((img) => img.id !== image.id));
                if (selectedId === image.id) setSelectedId(null);
              }}
              className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 inline-flex items-center justify-center rounded-full 
                         bg-red-600 hover:bg-red-700 text-white w-6 h-6 sm:w-7 sm:h-7 shadow-md opacity-0 group-hover:opacity-100"
              title="Remove tile"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Image */}
            <img
              src={image.src}
              alt={image.name}
              className="w-full h-full select-none pointer-events-none"
              style={{ objectFit: "cover" }}
              draggable={false}
            />

            {/* Corners */}
            <CornerHandle pos="nw" onPointerDown={(e) => startResizeCorner(e, image.id, "nw")} />
            <CornerHandle pos="ne" onPointerDown={(e) => startResizeCorner(e, image.id, "ne")} />
            <CornerHandle pos="sw" onPointerDown={(e) => startResizeCorner(e, image.id, "sw")} />
            <CornerHandle pos="se" onPointerDown={(e) => startResizeCorner(e, image.id, "se")} />

            {/* Sides */}
            <SideHandle pos="n" onPointerDown={(e) => startResizeSide(e, image.id, "n")} />
            <SideHandle pos="s" onPointerDown={(e) => startResizeSide(e, image.id, "s")} />
            <SideHandle pos="e" onPointerDown={(e) => startResizeSide(e, image.id, "e")} />
            <SideHandle pos="w" onPointerDown={(e) => startResizeSide(e, image.id, "w")} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoWall;
