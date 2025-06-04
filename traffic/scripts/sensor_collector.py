import serial
import json
import time
from datetime import datetime
import os
import numpy as np
from pathlib import Path

class IWR6843Collector:
    def __init__(self, port='/dev/tty.SLAB_USBtoUART', baudrate=115200):
        """
        Initialize the IWR6843ISK sensor collector
        
        Args:
            port (str): Serial port for the sensor
            baudrate (int): Baud rate for serial communication
        """
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.data_dir = Path('traffic/data')
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def connect(self):
        """Establish connection with the sensor"""
        try:
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=1
            )
            print(f"Connected to sensor on {self.port}")
            return True
        except serial.SerialException as e:
            print(f"Failed to connect to sensor: {e}")
            return False
            
    def disconnect(self):
        """Close the serial connection"""
        if self.serial and self.serial.is_open:
            self.serial.close()
            print("Disconnected from sensor")
            
    def read_point_cloud(self):
        """
        Read a single point cloud frame from the sensor
        
        Returns:
            dict: Point cloud data with timestamp
        """
        if not self.serial or not self.serial.is_open:
            print("Not connected to sensor")
            return None
            
        try:
            # Read the data line
            line = self.serial.readline().decode('utf-8').strip()
            
            # Parse the point cloud data
            # Note: This is a placeholder - actual parsing will depend on sensor output format
            data = {
                'timestamp': datetime.now().isoformat(),
                'points': [],  # Will contain [x, y, z] coordinates
                'count': 0     # Will contain detected people count
            }
            
            # Save raw data for debugging
            self._save_raw_data(line)
            
            return data
            
        except Exception as e:
            print(f"Error reading sensor data: {e}")
            return None
            
    def _save_raw_data(self, data):
        """Save raw sensor data to a file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = self.data_dir / f'raw_data_{timestamp}.txt'
        
        with open(filename, 'a') as f:
            f.write(f"{timestamp}: {data}\n")
            
    def collect_data(self, duration=60, interval=1):
        """
        Collect data for a specified duration
        
        Args:
            duration (int): Duration in seconds
            interval (int): Interval between readings in seconds
        """
        if not self.connect():
            return
            
        try:
            start_time = time.time()
            while time.time() - start_time < duration:
                data = self.read_point_cloud()
                if data:
                    print(f"People count: {data['count']}")
                time.sleep(interval)
                
        finally:
            self.disconnect()

def main():
    # Create collector instance
    collector = IWR6843Collector()
    
    # Collect data for 5 minutes
    print("Starting data collection...")
    collector.collect_data(duration=300, interval=1)
    print("Data collection complete")

if __name__ == "__main__":
    main() 