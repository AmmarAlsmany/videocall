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

/** ===== UI: Handles ===== **/
const CornerHandle = ({ pos, onPointerDown }) => {
  const base = 'absolute w-3 h-3 bg-white border border-gray-500 rounded-sm opacity-0 group-hover:opacity-100'
  const map = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  }
  return <div role="button" onPointerDown={onPointerDown} className={`${base} ${map[pos]}`} />
}
const SideHandle = ({ pos, onPointerDown }) => {
  const base = 'absolute w-2 h-2 bg-white border border-gray-500 rounded-sm opacity-0 group-hover:opacity-100'
  const map = {
    n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
    s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
    e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
    w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  }
  return <div role="button" onPointerDown={onPointerDown} className={`${base} ${map[pos]}`} />
}

function App() {
  const [draggedImage, setDraggedImage] = useState(null)
  const [droppedImages, setDroppedImages] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const canvasRef = useRef(null)

  // session refs to avoid stale closures in window listeners
  const movingRef = useRef(null)   // { id, grabOffset:{dx,dy} }
  const resizingRef = useRef(null) // { id, type:'corner'|'side', corner|edge, center, startSize:{w,h}, aspect, keepRatio, anchorOpposite }

  /** ===== Utils ===== **/
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect()
  const MIN_W = 40, MIN_H = 30

  // keep whole tile inside canvas (center-based)
  const clampCenter = (center, size) => {
    const rect = getCanvasRect()
    if (!rect) return center
    const halfW = size.w / 2, halfH = size.h / 2
    const minX = halfW, maxX = rect.width - halfW
    const minY = halfH, maxY = rect.height - halfH
    return {
      x: Math.min(Math.max(center.x, minX), Math.max(minX, maxX)),
      y: Math.min(Math.max(center.y, minY), Math.max(minY, maxY)),
    }
  }
  // when center is fixed, clamp size to canvas
  const clampSizeForCenter = (center, size) => {
    const rect = getCanvasRect()
    if (!rect) return size
    const maxW = 2 * Math.min(center.x, rect.width - center.x)
    const maxH = 2 * Math.min(center.y, rect.height - center.y)
    return {
      w: Math.max(MIN_W, Math.min(size.w, Math.floor(maxW))),
      h: Math.max(MIN_H, Math.min(size.h, Math.floor(maxH))),
    }
  }
  // clamp pointer so the result stays inside when anchoring opposite edge
  const clampPointerForEdge = (edge, oppositeConst, desired) => {
    const rect = getCanvasRect()
    if (!rect) return desired
    if (edge === 'e') {
      const minX = oppositeConst + MIN_W
      const maxX = rect.width
      return Math.min(Math.max(desired, minX), maxX)
    }
    if (edge === 'w') {
      const maxX = oppositeConst - MIN_W
      const minX = 0
      return Math.max(Math.min(desired, maxX), minX)
    }
    if (edge === 's') {
      const minY = oppositeConst + MIN_H
      const maxY = rect.height
      return Math.min(Math.max(desired, minY), maxY)
    }
    if (edge === 'n') {
      const maxY = oppositeConst - MIN_H
      const minY = 0
      return Math.max(Math.min(desired, maxY), minY)
    }
    return desired
  }

  /** ===== Drag from sources ===== **/
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
      position: center,           // center of tile
      size: init,
      aspect: init.w / init.h,
      name: draggedImage.name,
    }
    setDroppedImages((prev) => [...prev, newImage])
    setDraggedImage(null)
    setSelectedId(newImage.id)
  }

  /** ===== Move ===== **/
  const startMove = (e, id) => {
    e.stopPropagation()
    const rect = getCanvasRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const img = droppedImages.find((d) => d.id === id)
    if (!img) return
    movingRef.current = { id, grabOffset: { dx: px - img.position.x, dy: py - img.position.y } }
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
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endMove)
  }

  /** ===== Resize (corners + sides) ===== **/
  const startResizeCorner = (e, id, corner) => {
    e.preventDefault(); e.stopPropagation()
    const img = droppedImages.find((d) => d.id === id)
    if (!img) return
    resizingRef.current = {
      id,
      type: 'corner',
      corner,
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect ?? img.size.w / img.size.h,
      keepRatio: !e.shiftKey,          // Shift = freeform
      anchorOpposite: e.altKey,        // Alt = anchor opposite corner
    }
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', endResize)
  }
  const startResizeSide = (e, id, edge) => {
    e.preventDefault(); e.stopPropagation()
    const img = droppedImages.find((d) => d.id === id)
    if (!img) return
    resizingRef.current = {
      id,
      type: 'side',
      edge,                            // 'n'|'s'|'e'|'w'
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect ?? img.size.w / img.size.h,
      keepRatio: e.shiftKey,           // Shift = keep aspect on sides
      anchorOpposite: e.altKey,        // Alt = anchor opposite edge
    }
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', endResize)
  }

  const onResizeMove = (e) => {
    const session = resizingRef.current
    if (!session) return
    const rect = getCanvasRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    setDroppedImages((prev) => prev.map((img) => {
      if (img.id !== session.id) return img

      let center = { ...session.center }
      let w = img.size.w
      let h = img.size.h
      const aspect = session.aspect

      if (session.type === 'corner') {
        if (!session.anchorOpposite) {
          // center fixed
          let halfW = Math.abs(px - center.x)
          let halfH = Math.abs(py - center.y)
          if (session.keepRatio) {
            const wFromH = halfH * aspect
            const hFromW = halfW / aspect
            if (hFromW <= halfH) halfH = hFromW
            else halfW = wFromH
          }
          w = Math.max(MIN_W, Math.round(halfW * 2))
          h = Math.max(MIN_H, Math.round(halfH * 2))
          ;({ w, h } = clampSizeForCenter(center, { w, h }))
        } else {
          // anchor opposite corner: center shifts
          const oppX = center.x + (session.startSize.w / 2) * (session.corner.includes('w') ? 1 : -1)
          const oppY = center.y + (session.startSize.h / 2) * (session.corner.includes('n') ? 1 : -1)
          const clampedX = Math.min(Math.max(px, 0), rect.width)
          const clampedY = Math.min(Math.max(py, 0), rect.height)
          w = Math.max(MIN_W, Math.abs(clampedX - oppX))
          h = Math.max(MIN_H, Math.abs(clampedY - oppY))
          if (session.keepRatio) {
            const wFromH = h * aspect
            const hFromW = w / aspect
            if (hFromW <= h) h = hFromW
            else w = wFromH
          }
          center = { x: (clampedX + oppX) / 2, y: (clampedY + oppY) / 2 }
          center = clampCenter(center, { w, h })
        }
      } else {
        // side
        const edge = session.edge
        if (!session.anchorOpposite) {
          if (edge === 'e' || edge === 'w') {
            let halfW = Math.abs(px - center.x)
            if (session.keepRatio) {
              let halfH = halfW / aspect
              w = Math.max(MIN_W, Math.round(halfW * 2))
              h = Math.max(MIN_H, Math.round(halfH * 2))
            } else {
              w = Math.max(MIN_W, Math.round(halfW * 2))
              h = img.size.h
            }
            ;({ w, h } = clampSizeForCenter(center, { w, h }))
          } else {
            let halfH = Math.abs(py - center.y)
            if (session.keepRatio) {
              let halfW = halfH * aspect
              w = Math.max(MIN_W, Math.round(halfW * 2))
              h = Math.max(MIN_H, Math.round(halfH * 2))
            } else {
              h = Math.max(MIN_H, Math.round(halfH * 2))
              w = img.size.w
            }
            ;({ w, h } = clampSizeForCenter(center, { w, h }))
          }
        } else {
          // anchor opposite edge (center shifts)
          if (edge === 'e') {
            const oppX = center.x - session.startSize.w / 2
            const pX = clampPointerForEdge('e', oppX, px)
            w = Math.max(MIN_W, Math.abs(pX - oppX))
            if (session.keepRatio) h = Math.max(MIN_H, Math.round(w / aspect))
            else h = img.size.h
            center = { x: (pX + oppX) / 2, y: center.y }
            center = clampCenter(center, { w, h })
          } else if (edge === 'w') {
            const oppX = center.x + session.startSize.w / 2
            const pX = clampPointerForEdge('w', oppX, px)
            w = Math.max(MIN_W, Math.abs(oppX - pX))
            if (session.keepRatio) h = Math.max(MIN_H, Math.round(w / aspect))
            else h = img.size.h
            center = { x: (pX + oppX) / 2, y: center.y }
            center = clampCenter(center, { w, h })
          } else if (edge === 's') {
            const oppY = center.y - session.startSize.h / 2
            const pY = clampPointerForEdge('s', oppY, py)
            h = Math.max(MIN_H, Math.abs(pY - oppY))
            if (session.keepRatio) w = Math.max(MIN_W, Math.round(h * aspect))
            else w = img.size.w
            center = { x: center.x, y: (pY + oppY) / 2 }
            center = clampCenter(center, { w, h })
          } else if (edge === 'n') {
            const oppY = center.y + session.startSize.h / 2
            const pY = clampPointerForEdge('n', oppY, py)
            h = Math.max(MIN_H, Math.abs(oppY - pY))
            if (session.keepRatio) w = Math.max(MIN_W, Math.round(h * aspect))
            else w = img.size.w
            center = { x: center.x, y: (pY + oppY) / 2 }
            center = clampCenter(center, { w, h })
          }
        }
      }

      return { ...img, position: center, size: { w, h }, aspect }
    }))
  }
  const endResize = () => {
    resizingRef.current = null
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', endResize)
  }

  /** ===== Selection + Delete ===== **/
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setDroppedImages((prev) => prev.filter((img) => img.id !== selectedId))
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endMove)
      window.removeEventListener('pointermove', onResizeMove)
      window.removeEventListener('pointerup', endResize)
    }
  }, [])

  /** ===== Nav & Sources ===== **/
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

  /** ===== Render ===== **/
  return (
    <div className="h-screen py-1 pl-1 bg-[#E4E4E4] flex">
      {/* Left panel */}
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
                <img src={item.icon} alt={item.label} className={`w-6 h-6 ${item.isLogout ? '' : 'filter brightness-0 invert'}`} />
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

      {/* Display column */}
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

            {/* Canvas */}
            <div
              ref={canvasRef}
              className="flex-1 border border-gray-300 rounded-xl p-4 mb-6 relative overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onPointerDown={() => setSelectedId(null)}
            >
              <h3 className="text-[#A3A5A7] text-lg font-bold mb-2">Table Monitors</h3>
              <p className="text-[#A3A5A7] text-sm">Drag from sources</p>

              {droppedImages.map((image, idx) => (
                <div
                  key={image.id}
                  onPointerDown={(e) => {
                    // bring to front
                    setDroppedImages((prev) => {
                      const i = prev.findIndex((p) => p.id === image.id)
                      if (i === -1) return prev
                      const copy = [...prev]
                      const [it] = copy.splice(i, 1)
                      copy.push(it)
                      return copy
                    })
                    setSelectedId(image.id)
                    startMove(e, image.id)
                  }}
                  className={`absolute rounded-lg overflow-hidden group flex items-center justify-center bg-black ${
                    selectedId === image.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: `${image.position.x}px`,
                    top: `${image.position.y}px`,
                    width: `${image.size.w}px`,
                    height: `${image.size.h}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                    touchAction: 'none',
                    zIndex: idx + 1,
                  }}
                >
                  {/* FIT MODE (no zoom, no crop) */}
                  <img
                    src={image.src}
                    alt={image.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                    className="select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Corners */}
                  <CornerHandle pos="nw" onPointerDown={(e) => startResizeCorner(e, image.id, 'nw')} />
                  <CornerHandle pos="ne" onPointerDown={(e) => startResizeCorner(e, image.id, 'ne')} />
                  <CornerHandle pos="sw" onPointerDown={(e) => startResizeCorner(e, image.id, 'sw')} />
                  <CornerHandle pos="se" onPointerDown={(e) => startResizeCorner(e, image.id, 'se')} />

                  {/* Sides */}
                  <SideHandle pos="n" onPointerDown={(e) => startResizeSide(e, image.id, 'n')} />
                  <SideHandle pos="s" onPointerDown={(e) => startResizeSide(e, image.id, 's')} />
                  <SideHandle pos="e" onPointerDown={(e) => startResizeSide(e, image.id, 'e')} />
                  <SideHandle pos="w" onPointerDown={(e) => startResizeSide(e, image.id, 'w')} />
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
