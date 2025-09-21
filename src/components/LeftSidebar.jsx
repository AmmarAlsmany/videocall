import React from 'react';
import logo from '../assets/logo.png';
import houseIcon from '../assets/icon/House.png';
import monitorPlayIcon from '../assets/icon/MonitorPlay.png';
import pictureInPictureIcon from '../assets/icon/PictureInPicture.png';
import videoCameraIcon from '../assets/icon/VideoCamera.png';
import lightbulbIcon from '../assets/icon/Lightbulb.png';
import lightningIcon from '../assets/icon/Lightning.png';
import callBellIcon from '../assets/icon/CallBell.png';
import settingsIcon from '../assets/icon/SettingsIcon.png';
import logoutIcon from '../assets/icon/LogoutIcon.png';
import sourceImage1 from '../assets/source/Source Item (1).png';
import sourceImage2 from '../assets/source/Source Item (2).png';
import sourceImage3 from '../assets/source/Source Item (3).png';
import sourceImage4 from '../assets/source/Source Item (4).png';
import sourceImage5 from '../assets/source/Source Item.png';
import sourceImage6 from '../assets/source/image.png';
import mainDisplay from '../assets/source/Main Display.png';
import secondaryDisplay from '../assets/source/Secondary Display.png';

const LeftSidebar = ({ onDragStart }) => {
  const navItems = [
    { icon: houseIcon, label: "Home", active: false },
    { icon: monitorPlayIcon, label: "Presentation", active: true },
    { icon: pictureInPictureIcon, label: "Folder", active: false },
    { icon: videoCameraIcon, label: "Camera", active: false },
    { icon: lightbulbIcon, label: "Light", active: false },
    { icon: lightningIcon, label: "Lightning", active: false },
    { icon: callBellIcon, label: "Notifications", active: false },
  ];

  const bottomNavItems = [
    { icon: settingsIcon, label: "Settings", active: false },
    { icon: logoutIcon, label: "Logout", active: false, isLogout: true },
  ];

  const sourceImages = [
    { src: sourceImage1, name: "Camera" },
    { src: sourceImage2, name: "Presentation" },
    { src: sourceImage3, name: "Conference" },
    { src: sourceImage4, name: "Sharepoint" },
    { src: sourceImage5, name: "Dashboard" },
    { src: sourceImage6, name: "Image" },
    { src: mainDisplay, name: "Main Display" },
    { src: secondaryDisplay, name: "Secondary Display" },
  ];

  return (
    <div className="bg-black rounded-3xl w-1/5 h-full flex">
      {/* Navigation Column */}
      <div className="w-3/12 border-r border-[#292929] flex flex-col items-center justify-between">
        <img src={logo} alt="Logo" className="img-fluid mb-8 mt-4" />
        
        <div className="flex flex-col items-center space-y-4 flex-1 justify-center">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                item.active ? "bg-green-500" : "bg-[#20242B] hover:bg-green-500"
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

        <div className="flex flex-col items-center space-y-4 mb-4">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              className="w-12 h-12 flex items-center justify-center transition-colors hover:bg-green-500 rounded-full cursor-pointer"
              title={item.label}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-6 h-6 ${
                  item.isLogout ? "" : "filter brightness-0 invert"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Source Column */}
      <div className="w-10/12 p-6 flex flex-col">
        <h2 className="text-white text-lg font-medium mb-4">Source</h2>
        
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#191D24] text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:border-green-500 focus:outline-none pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" }}
        >
          <div className="space-y-4">
            {sourceImages.map((item, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity"
                draggable
                onDragStart={(e) => onDragStart(e, item)}
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
  );
};

export default LeftSidebar;
