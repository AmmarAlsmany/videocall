import React, { useState } from 'react'
import logo from './assets/logo.png'
import houseIcon from './assets/icon/House.png'
import monitorPlayIcon from './assets/icon/MonitorPlay.png'
import pictureInPictureIcon from './assets/icon/PictureInPicture.png'
import videoCameraIcon from './assets/icon/VideoCamera.png'
import lightbulbIcon from './assets/icon/Lightbulb.png'
import lightningIcon from './assets/icon/Lightning.png'
import slidersIcon from './assets/icon/Sliders.png'
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

function App() {
  const [draggedImage, setDraggedImage] = useState(null)
  const [droppedImages, setDroppedImages] = useState([])
  const [draggedDroppedImage, setDraggedDroppedImage] = useState(null)

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
    if (draggedImage) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newImage = {
        ...draggedImage,
        id: Date.now(),
        position: { x, y }
      }
      
      setDroppedImages(prev => [...prev, newImage])
      setDraggedImage(null)
    }
  }

  const handleDroppedImageDragStart = (e, imageId) => {
    setDraggedDroppedImage(imageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDroppedImageDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDroppedImageDrop = (e) => {
    e.preventDefault()
    if (draggedDroppedImage) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setDroppedImages(prev => 
        prev.map(img => 
          img.id === draggedDroppedImage 
            ? { ...img, position: { x, y } }
            : img
        )
      )
      setDraggedDroppedImage(null)
    }
  }


  const navItems = [
    { icon: houseIcon, label: 'Home', active: false },
    { icon: monitorPlayIcon, label: 'Presentation', active: true },
    { icon: pictureInPictureIcon, label: 'Folder', active: false },
    { icon: videoCameraIcon, label: 'Camera', active: false },
    { icon: lightbulbIcon, label: 'Light', active: false },
    { icon: lightningIcon, label: 'Lightning', active: false },
    { icon: callBellIcon, label: 'Notifications', active: false }
  ]

  const bottomNavItems = [
    { icon: settingsIcon, label: 'Settings', active: false },
    { icon: logoutIcon, label: 'Logout', active: false, isLogout: true }
  ]

  const sourceImages = [
    { src: sourceImage1, name: 'Camera' },
    { src: sourceImage2, name: 'Presentation' },
    { src: sourceImage3, name: 'Conference' },
    { src: sourceImage4, name: 'Sharepoint' },
    { src: sourceImage5, name: 'Dashboard' },
    { src: sourceImage6, name: 'Image' },
    { src: mainDisplay, name: 'Main Display' },
    { src: secondaryDisplay, name: 'Secondary Display' }
  ]

  return (
    <div className="h-screen py-1 pl-1 bg-[#E4E4E4] flex">
      {/* Bootstrap 7-column layout with border */}
      <div className="bg-black rounded-3xl w-1/5 h-full flex">
        <div className="w-3/12 border-r border-[#292929] flex flex-col items-center justify-between">
          <img src={logo} alt="Logo" className="img-fluid mb-8 mt-4" />
          
          {/* Main Navigation Icons */}
          <div className="flex flex-col items-center space-y-4 flex-1 justify-center">
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  item.active 
                    ? 'bg-green-500' 
                    : 'bg-[#20242B] hover:bg-gray-500'
                }`}
                title={item.label}
              >
                <img 
                  src={item.icon} 
                  alt={item.label} 
                  className="w-6 h-6 filter brightness-0 invert"
                />
              </button>
            ))}
          </div>

          {/* Bottom Navigation Icons */}
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
        <div className="w-10/12 p-6 flex flex-col">
          <h2 className="text-white text-lg font-medium mb-4">Source</h2>
          
          {/* Search Bar */}
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
          <div className="flex-1 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent'}}>
            <div className="space-y-4">
              {sourceImages.map((item, index) => (
                <div 
                  key={index} 
                  className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                >
                  <div className="aspect-video relative">
                    <img
                      src={item.src}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* Display Column - Separate from black container */}
        <div className="w-[70%] h-full p-6 flex flex-col border rounded-xl">
          {/* Display Header with Recording Indicator */}
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
          
          {/* Display Content */}
          <div className="flex-1 rounded-lg flex flex-col">
            {/* Top Row - 50% height */}
            <div className="h-2/3 bg-white rounded-xl mb-4 p-4 flex flex-col">
              {/* Video Wall Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-2">
                  <img src={powerButtonIcon} alt="Power" className="img-fluid cursor-pointer" />
                  <img src={largeScreenIcon} alt="Large Screen" className="img-fluid  cursor-pointer" />
                </div>
                <div className="text-right">
                  <h3 className="text-[#A3A5A7] text-lg font-bold">Video Wall</h3>
                  <p className="text-[#A3A5A7] text-sm">Drag from sources</p>
                </div>
              </div>
              
              <div 
                className="flex-1 border border-gray-300 rounded-xl p-4 mb-6 relative"
                onDragOver={(e) => {
                  handleDragOver(e)
                  handleDroppedImageDragOver(e)
                }}
                onDrop={(e) => {
                  if (draggedDroppedImage) {
                    handleDroppedImageDrop(e)
                  } else {
                    handleDrop(e)
                  }
                }}
              >
                <h3 className="text-[#A3A5A7] text-lg font-bold mb-2">Table Monitors</h3>
                <p className="text-[#A3A5A7] text-sm">Drag from sources</p>
                
                {/* Dropped Images */}
                {droppedImages.map((image) => (
                  <div
                    key={image.id}
                    className="absolute w-24 h-16 rounded-lg overflow-hidden cursor-move"
                    style={{
                      left: `${image.position.x}px`,
                      top: `${image.position.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    draggable
                    onDragStart={(e) => handleDroppedImageDragStart(e, image.id)}
                  >
                    <img
                      src={image.src}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
             </div>
               
            </div>
            
            {/* Bottom Row - remaining space */}
           
          </div>
        </div>
    </div>
  )
}

export default App
