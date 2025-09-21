import React, { useEffect, useRef, useState } from 'react'
import logo from './assets/logo.png'
import houseIcon from './assets/icon/House.png'
import monitorPlayIcon from './assets/icon/MonitorPlay.png'
import pictureInPictureIcon from './assets/icon/PictureInPicture.png'
import videoCameraIcon from './assets/icon/VideoCamera.png'
import lightbulbIcon from './assets/icon/Lightbulb.png'
import lightningIcon from './assets/icon/Lightning.png'
import callBellIcon from './assets/icon/CallBell.png'
import settingsIcon from './assets/icon/SettingsIcon.png'
import logoutIcon from './assets/icon/LogoutIcon.png'
import powerButtonIcon from './assets/powerbutton.png'
import largeScreenIcon from './assets/largescreen.png'
import sourceImage1 from './assets/source/Source Item (1).png'
import sourceImage2 from './assets/source/Source Item (2).png'
import sourceImage3 from './assets/source/Source Item (3).png'
import sourceImage4 from './assets/source/Source Item (4).png'
import sourceImage5 from './assets/source/Source Item.png'
import sourceImage6 from './assets/source/image.png'
import mainDisplay from './assets/source/Main Display.png'
import secondaryDisplay from './assets/source/Secondary Display.png'

const Handle = ({ pos, onPointerDown }) => {
  const base =
    'absolute w-3 h-3 bg-white border border-gray-500 rounded-sm opacity-0 group-hover:opacity-100'
  const map = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  }
  return <div role="button" onPointerDown={onPointerDown} className={`${base} ${map[pos]}`} />
}

function App() {
  const [draggedImage, setDraggedImage] = useState(null)
  const [droppedImages, setDroppedImages] = useState([])

  const canvasRef = useRef(null)

  // --- useRef to avoid stale closures in window listeners ---
  const movingRef = useRef(null)   // { id, grabOffset:{dx,dy} }
  const resizingRef = useRef(null) // { id, corner, center, startSize:{w,h}, aspect, keepRatio }

  // (Optional, just for debugging UI state)
  const [movingState, setMovingState] = useState(null)
  const [resizingState, setResizingState] = useState(null)

  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect()

  const clampCenter = (center, size) => {
    const rect = getCanvasRect()
    if (!rect) return center
    const halfW = size.w / 2
    const halfH = size.h / 2
    const minX = halfW
    const maxX = rect.width - halfW
    const minY = halfH
    const maxY = rect.height - halfH
    return {
      x: Math.min(Math.max(center.x, minX), Math.max(minX, maxX)),
      y: Math.min(Math.max(center.y, minY), Math.max(minY, maxY)),
    }
  }

  const clampSizeForCenter = (center, size) => {
    const rect = getCanvasRect()
    if (!rect) return size
    const maxW = 2 * Math.min(center.x, rect.width - center.x)
    const maxH = 2 * Math.min(center.y, rect.height - center.y)
    return {
      w: Math.min(size.w, Math.max(20, Math.floor(maxW))),
      h: Math.min(size.h, Math.max(20, Math.floor(maxH))),
    }
  }

  // ---- Drag from sources ----
  const handleDragStart = (e, imageData) => {
    setDraggedImage(imageData)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDrop = (e) => {
    e.preventDefault()
    if (!draggedImage) return
    const rect = getCanvasRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const init = { w: 160, h: 100 }
    const center = clampCenter({ x, y }, init)
    const newImage = {
      ...draggedImage,
      id: Date.now(),
      position: center, // center
      size: init,
      aspect: init.w / init.h,
      name: draggedImage.name,
    }
    setDroppedImages((prev) => [...prev, newImage])
    setDraggedImage(null)
  }

  // ---- MOVE (use refs) ----
  const startMove = (e, id) => {
    e.stopPropagation()
    const rect = getCanvasRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const img = droppedImages.find((d) => d.id === id)
    if (!img) return
    const payload = { id, grabOffset: { dx: px - img.position.x, dy: py - img.position.y } }
    movingRef.current = payload
    setMovingState(payload)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endMove)
  }
  const onMove = (e) => {
    const moving = movingRef.current
    if (!moving) return
    const rect = getCanvasRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    setDroppedImages((prev) =>
      prev.map((img) => {
        if (img.id !== moving.id) return img
        const center = { x: px - moving.grabOffset.dx, y: py - moving.grabOffset.dy }
        const clampedCenter = clampCenter(center, img.size)
        return { ...img, position: clampedCenter }
      })
    )
  }
  const endMove = () => {
    movingRef.current = null
    setMovingState(null)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endMove)
  }

  // ---- RESIZE (use refs) ----
  const startResize = (e, id, corner) => {
    e.preventDefault()
    e.stopPropagation()
    const img = droppedImages.find((d) => d.id === id)
    if (!img) return
    const payload = {
      id,
      corner,
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect ?? img.size.w / img.size.h,
      keepRatio: !e.shiftKey, // hold Shift for freeform
    }
    resizingRef.current = payload
    setResizingState(payload)
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', endResize)
  }
  const onResizeMove = (e) => {
    const resizing = resizingRef.current
    if (!resizing) return
    const rect = getCanvasRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    // distance from center to pointer → desired half sizes
    let halfW = Math.abs(px - resizing.center.x)
    let halfH = Math.abs(py - resizing.center.y)

    if (resizing.keepRatio) {
      const r = resizing.aspect
      // fit pointer into aspect box
      const wFromH = halfH * r
      const hFromW = halfW / r
      if (hFromW <= halfH) {
        halfH = hFromW
      } else {
        halfW = wFromH
      }
    }

    const minW = 40,
      minH = 30
    halfW = Math.max(halfW, minW / 2)
    halfH = Math.max(halfH, minH / 2)

    let newW = Math.round(halfW * 2)
    let newH = Math.round(halfH * 2)

    const clamped = clampSizeForCenter(resizing.center, { w: newW, h: newH })
    newW = clamped.w
    newH = clamped.h

    setDroppedImages((prev) =>
      prev.map((img) =>
        img.id === resizing.id ? { ...img, size: { w: newW, h: newH }, aspect: resizing.aspect } : img
      )
    )
  }
  const endResize = () => {
    resizingRef.current = null
    setResizingState(null)
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', endResize)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endMove)
      window.removeEventListener('pointermove', onResizeMove)
      window.removeEventListener('pointerup', endResize)
    }
  }, [])

  const navItems = [
    { icon: houseIcon, label: 'Home', active: false },
    { icon: monitorPlayIcon, label: 'Presentation', active: true },
    { icon: pictureInPictureIcon, label: 'Folder', active: false },
    { icon: videoCameraIcon, label: 'Camera', active: false },
    { icon: lightbulbIcon, label: 'Light', active: false },
    { icon: lightningIcon, label: 'Lightning', active: false },
    { icon: callBellIcon, label: 'Notifications', active: false },
  ]
  const bottomNavItems = [
    { icon: settingsIcon, label: 'Settings', active: false },
    { icon: logoutIcon, label: 'Logout', active: false, isLogout: true },
  ]
  const sourceImages = [
    { src: sourceImage1, name: 'Camera' },
    { src: sourceImage2, name: 'Presentation' },
    { src: sourceImage3, name: 'Conference' },
    { src: sourceImage4, name: 'Sharepoint' },
    { src: sourceImage5, name: 'Dashboard' },
    { src: sourceImage6, name: 'Image' },
    { src: mainDisplay, name: 'Main Display' },
    { src: secondaryDisplay, name: 'Secondary Display' },
  ]

  return (
    <div className="h-screen py-1 pl-1 bg-[#E4E4E4] flex">
      {/* Left black panel */}
      <div className="bg-black rounded-3xl w-1/5 h-full flex">
        <div className="w-3/12 border-r border-[#292929] flex flex-col items-center justify-between">
          <img src={logo} alt="Logo" className="img-fluid mb-8 mt-4" />

          <div className="flex flex-col items-center space-y-4 flex-1 justify-center">
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  item.active ? 'bg-green-500' : 'bg-[#20242B] hover:bg-gray-500'
                }`}
                title={item.label}
              >
                <img src={item.icon} alt={item.label} className="w-6 h-6 filter brightness-0 invert" />
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center space-y-4 mb-4">
            {bottomNavItems.map((item, index) => (
              <button
                key={index}
                className="w-12 h-12 flex items-center justify-center transition-colors hover:bg-gray-500 rounded-full"
                title={item.label}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className={`w-6 h-6 ${item.isLogout ? '' : 'filter brightness-0 invert'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Sources column */}
        <div className="w-10/12 p-6 flex flex-col">
          <h2 className="text-white text-lg font-medium mb-4">Source</h2>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#191D24] text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:border-green-500 focus:outline-none pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Source Images */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}>
            <div className="space-y-4">
              {sourceImages.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                >
                  <div className="aspect-video relative">
                    <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Display Column */}
      <div className="w-[70%] h-full p-6 flex flex-col border rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-gray-800 text-lg font-medium">Displays</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-red-500 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            </div>
            <span className="text-red-600 text-sm font-medium">Rec</span>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-800 text-sm font-medium">32:55</span>
          </div>
        </div>

        {/* Canvas / Table Monitors */}
        <div className="flex-1 rounded-lg flex flex-col">
          <div className="h-2/3 bg-white rounded-xl mb-4 p-4 flex flex-col">
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

            <div
              ref={canvasRef}
              className="flex-1 border border-gray-300 rounded-xl p-4 mb-6 relative overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <h3 className="text-[#A3A5A7] text-lg font-bold mb-2">Table Monitors</h3>
              <p className="text-[#A3A5A7] text-sm">Drag from sources</p>

              {droppedImages.map((image) => (
                <div
                  key={image.id}
                  className="absolute rounded-lg overflow-hidden group"
                  style={{
                    left: `${image.position.x}px`,
                    top: `${image.position.y}px`,
                    width: `${image.size.w}px`,
                    height: `${image.size.h}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => startMove(e, image.id)}
                >
                  <img
                    src={image.src}
                    alt={image.name}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />

                  <Handle pos="nw" onPointerDown={(e) => startResize(e, image.id, 'nw')} />
                  <Handle pos="ne" onPointerDown={(e) => startResize(e, image.id, 'ne')} />
                  <Handle pos="sw" onPointerDown={(e) => startResize(e, image.id, 'sw')} />
                  <Handle pos="se" onPointerDown={(e) => startResize(e, image.id, 'se')} />
                </div>
              ))}
            </div>
          </div>

          {/* bottom row reserved */}
        </div>
      </div>
    </div>
  )
}

export default App
