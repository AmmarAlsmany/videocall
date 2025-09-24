import React, { useState, useEffect } from 'react';
import { useDeviceScanner } from '../hooks/useDeviceScanner';
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

const LeftSidebar = ({ onDragStart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    devices,
    deviceCategories,
    isScanning,
    lastScan,
    totalDevices,
    loading,
    error,
    startScanning,
    stopScanning,
    triggerRescan,
    deviceToImageFormat,
    hasDevices
  } = useDeviceScanner();

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

  // Auto-start scanning on component mount
  useEffect(() => {
    if (!isScanning) {
      startScanning();
    }
  }, []);

  // Filter devices based on search term
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ip.includes(searchTerm) ||
    device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle scanning toggle
  const handleScanToggle = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  // Generate device icon based on type with fallback
  const getDeviceIcon = (device) => {
    // Create a data URL for a simple colored rectangle as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    // Choose color based on device type
    const colors = {
      'IP Camera': '#3b82f6',
      'Network Device': '#10b981',
      'Router': '#8b5cf6',
      'Server': '#f59e0b',
      'PC': '#ef4444',
      'Unknown': '#6b7280'
    };

    ctx.fillStyle = colors[device.type] || colors['Unknown'];
    ctx.fillRect(0, 0, 100, 60);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(device.type, 50, 25);
    ctx.fillText(device.manufacturer, 50, 40);

    return canvas.toDataURL();
  };

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
        {/* Header with scan controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-medium">Network Devices</h2>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {totalDevices} devices
            </span>
            <button
              onClick={handleScanToggle}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                isScanning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isScanning ? 'Stop' : 'Scan'}
            </button>
            <button
              onClick={triggerRescan}
              disabled={!isScanning}
              className="px-3 py-1 text-xs rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rescan
            </button>
          </div>
        </div>

        {/* Scan status */}
        {isScanning && (
          <div className="mb-4 text-xs text-green-400 flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Scanning network...
          </div>
        )}

        {lastScan && (
          <div className="mb-4 text-xs text-gray-500">
            Last scan: {lastScan}
          </div>
        )}

        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {loading && (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading devices...
            </div>
          )}

          {!loading && !hasDevices && !isScanning && (
            <div className="text-center text-gray-400 py-8">
              <div className="mb-4">No devices found</div>
              <button
                onClick={startScanning}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Start Scanning
              </button>
            </div>
          )}

          {!loading && hasDevices && (
            <div className="space-y-4">
              {/* Show devices by category */}
              {Object.entries(deviceCategories).map(([category, categoryDevices]) => (
                categoryDevices.length > 0 && (
                  <div key={category}>
                    <h3 className="text-gray-300 text-sm font-medium mb-2">{category}</h3>
                    {categoryDevices
                      .filter(device =>
                        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        device.ip.includes(searchTerm) ||
                        device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((device, index) => {
                        const imageData = deviceToImageFormat(device);
                        return (
                          <div
                            key={device.id}
                            className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity bg-[#191D24] border border-gray-700 hover:border-green-500"
                            draggable
                            onDragStart={(e) => onDragStart(e, {
                              ...imageData,
                              src: getDeviceIcon(device)
                            })}
                          >
                            <div className="aspect-video relative">
                              <img
                                src={getDeviceIcon(device)}
                                alt={device.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <div className="text-white text-xs font-medium">{device.name}</div>
                                <div className="text-gray-300 text-xs">{device.ip}</div>
                                {device.confidence > 50 && (
                                  <div className="text-green-400 text-xs">
                                    {device.confidence}% confident
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )
              ))}

              {/* Show all filtered devices if search is active */}
              {searchTerm && (
                <div>
                  <h3 className="text-gray-300 text-sm font-medium mb-2">
                    Search Results ({filteredDevices.length})
                  </h3>
                  {filteredDevices.map((device) => {
                    const imageData = deviceToImageFormat(device);
                    return (
                      <div
                        key={device.id}
                        className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity bg-[#191D24] border border-gray-700 hover:border-green-500 mb-2"
                        draggable
                        onDragStart={(e) => onDragStart(e, {
                          ...imageData,
                          src: getDeviceIcon(device)
                        })}
                      >
                        <div className="aspect-video relative">
                          <img
                            src={getDeviceIcon(device)}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <div className="text-white text-xs font-medium">{device.name}</div>
                            <div className="text-gray-300 text-xs">{device.ip}</div>
                            <div className="text-gray-400 text-xs">{device.type}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
