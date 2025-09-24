from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import json
from network_scanner import NetworkStreamScanner

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global variables to store scanner state
scanner = None
scan_thread = None
is_scanning = False
last_scan_results = {
    'devices': [],
    'scan_timestamp': None,
    'total_devices': 0,
    'device_categories': {
        'IP Cameras': [],
        'Network Devices': [],
        'Servers': [],
        'PCs': [],
        'Unknown': []
    }
}

def continuous_scan():
    """Background scanning function"""
    global scanner, last_scan_results, is_scanning

    while is_scanning:
        try:
            print("🔍 Starting network scan...")

            # Perform network scan
            scanner.scan_network()

            # Get device info with identification
            streaming_hosts = []
            for host in scanner.active_hosts:
                open_ports = []
                for port in scanner.streaming_ports:
                    if scanner.scan_port(host, port):
                        open_ports.append(port)

                if open_ports:
                    # Identify device
                    device_info = scanner.identify_device(host, open_ports)

                    # Create device entry
                    device = {
                        'id': f"device_{host.replace('.', '_')}",
                        'name': f"{device_info['manufacturer']} {device_info['type']}",
                        'ip': host,
                        'type': device_info['type'],
                        'manufacturer': device_info['manufacturer'],
                        'model': device_info['model'],
                        'confidence': device_info['confidence'],
                        'ports': open_ports,
                        'services': device_info['services'],
                        'src': generate_device_icon(device_info['type']),
                        'status': 'online'
                    }

                    streaming_hosts.append(device)

            # Categorize devices
            device_categories = {
                'IP Cameras': [],
                'Network Devices': [],
                'Servers': [],
                'PCs': [],
                'Unknown': []
            }

            for device in streaming_hosts:
                device_type = device['type']
                if 'Camera' in device_type:
                    device_categories['IP Cameras'].append(device)
                elif 'Network' in device_type or 'Router' in device_type:
                    device_categories['Network Devices'].append(device)
                elif 'Server' in device_type:
                    device_categories['Servers'].append(device)
                elif 'PC' in device_type:
                    device_categories['PCs'].append(device)
                else:
                    device_categories['Unknown'].append(device)

            # Update results
            last_scan_results = {
                'devices': streaming_hosts,
                'scan_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'total_devices': len(streaming_hosts),
                'device_categories': device_categories,
                'network_range': scanner.get_local_network()
            }

            print(f"✅ Scan complete. Found {len(streaming_hosts)} devices")

        except Exception as e:
            print(f"❌ Scan error: {e}")

        # Wait before next scan (scan every 30 seconds)
        time.sleep(30)

def generate_device_icon(device_type):
    """Generate appropriate icon path based on device type"""
    icon_map = {
        'IP Camera': '/src/assets/source/camera.png',
        'Network Device': '/src/assets/source/router.png',
        'Router': '/src/assets/source/router.png',
        'Linux Server': '/src/assets/source/server.png',
        'Windows PC': '/src/assets/source/pc.png',
        'Streaming Server': '/src/assets/source/stream.png',
        'Web Service': '/src/assets/source/web.png'
    }
    return icon_map.get(device_type, '/src/assets/source/unknown.png')

@app.route('/api/devices', methods=['GET'])
def get_devices():
    """Get current list of discovered devices"""
    return jsonify({
        'status': 'success',
        'data': last_scan_results
    })

@app.route('/api/devices/categories', methods=['GET'])
def get_device_categories():
    """Get devices organized by categories"""
    return jsonify({
        'status': 'success',
        'categories': last_scan_results['device_categories'],
        'total': last_scan_results['total_devices'],
        'timestamp': last_scan_results['scan_timestamp']
    })

@app.route('/api/scan/start', methods=['POST'])
def start_scanning():
    """Start continuous network scanning"""
    global scanner, scan_thread, is_scanning

    if is_scanning:
        return jsonify({
            'status': 'info',
            'message': 'Scanning already in progress'
        })

    try:
        scanner = NetworkStreamScanner()
        is_scanning = True
        scan_thread = threading.Thread(target=continuous_scan, daemon=True)
        scan_thread.start()

        return jsonify({
            'status': 'success',
            'message': 'Network scanning started'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to start scanning: {str(e)}'
        })

@app.route('/api/scan/stop', methods=['POST'])
def stop_scanning():
    """Stop network scanning"""
    global is_scanning

    is_scanning = False

    return jsonify({
        'status': 'success',
        'message': 'Network scanning stopped'
    })

@app.route('/api/scan/status', methods=['GET'])
def get_scan_status():
    """Get current scanning status"""
    return jsonify({
        'status': 'success',
        'is_scanning': is_scanning,
        'last_scan': last_scan_results['scan_timestamp'],
        'device_count': last_scan_results['total_devices']
    })

@app.route('/api/device/<device_id>', methods=['GET'])
def get_device_details(device_id):
    """Get detailed information about a specific device"""
    device = next((d for d in last_scan_results['devices'] if d['id'] == device_id), None)

    if not device:
        return jsonify({
            'status': 'error',
            'message': 'Device not found'
        }), 404

    return jsonify({
        'status': 'success',
        'device': device
    })

@app.route('/api/rescan', methods=['POST'])
def trigger_rescan():
    """Trigger an immediate rescan"""
    if not is_scanning:
        return jsonify({
            'status': 'error',
            'message': 'Scanning not active. Start scanning first.'
        })

    # The continuous scan will pick this up on next iteration
    return jsonify({
        'status': 'success',
        'message': 'Rescan will occur within 30 seconds'
    })

if __name__ == '__main__':
    print("🚀 Starting Device Discovery API Server...")
    print("📡 API will be available at http://localhost:5000")
    print("🔍 Available endpoints:")
    print("   GET  /api/devices - Get all discovered devices")
    print("   GET  /api/devices/categories - Get categorized devices")
    print("   POST /api/scan/start - Start network scanning")
    print("   POST /api/scan/stop - Stop network scanning")
    print("   GET  /api/scan/status - Get scanning status")
    print("   POST /api/rescan - Trigger immediate rescan")

    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)