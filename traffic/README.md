# Zero Foot Traffic Monitoring System

## Project Structure
```
traffic/
├── data/           # Raw sensor data and processed data
├── scripts/        # Python scripts for data collection and processing
├── config/         # Configuration files
└── logs/          # System logs
```

## Setup Instructions

### Hardware Requirements
- Texas Instruments IWR6843ISK sensor
- USB cable (Type A to Type B)
- 5V 2.5A power supply (2.1mm barrel plug, center positive)

### Software Requirements
- Python 3.9+
- Required Python packages (see requirements.txt)
- mmWave SDK
- mmWave Studio
- Code Composer Studio (CCS)

### Initial Setup
1. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

2. Connect the sensor:
   - Connect the IWR6843ISK sensor to your computer via USB
   - Connect the power supply
   - Note the USB port (will be needed in configuration)

3. Configure the sensor:
   - Update the port in `config/sensor_config.json`
   - Adjust other parameters as needed

4. Run initial test:
   ```bash
   python scripts/sensor_collector.py
   ```

## Development Status
- [x] Project structure setup
- [ ] Basic data collection
- [ ] Data processing
- [ ] Real-time visualization
- [ ] Historical analysis
- [ ] Integration with main dashboard

## Testing
Current testing is being conducted in a controlled environment (apartment) to validate:
- Sensor connectivity
- Data collection accuracy
- People detection reliability
- System stability

## Notes
- Raw data is stored in `data/` directory
- Logs are stored in `logs/` directory
- Configuration can be modified in `config/` directory 