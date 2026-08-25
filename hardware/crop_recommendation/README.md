# ESP32 Crop Recommendation Hardware

This directory contains the firmware for the ESP32 to read environmental and soil sensors, then transmit the telemetry to the Crop-Care-Crew backend.

## Hardware Required
- ESP32 or ESP32-CAM (Ensure correct pin mappings if using CAM version as many pins are reserved for the camera/SD card).
- DHT11 / DHT22 Temperature & Humidity Sensor
- Soil Moisture Sensor (Analog)
- pH Sensor (Analog)
- Water Sensor (Analog)
- NPK Sensor (Modbus RS485 - requires RS485 to TTL module)
- LM393 Dual Comparator (Digital)
- Q-LED (Indicator)

## Setup Instructions

1. **Install Arduino IDE**
2. **Install ESP32 Board Support** in Arduino IDE.
3. **Install Required Libraries**:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
4. **Configure Credentials**:
   - Open `config.h`.
   - Update `WIFI_SSID` and `WIFI_PASSWORD` with your local network details.
   - Update `SERVER_URL` with your local computer's IP address (e.g., `http://192.168.1.5:5005/api/hardware/telemetry`).
5. **Compile & Flash**:
   - Select your ESP32 board in Arduino IDE.
   - Upload the sketch.

## Pin Mappings
(These can be customized in `config.h`)

| Sensor | ESP32 Pin |
|--------|-----------|
| DHT11 / DHT22 | GPIO 4 |
| Soil Moisture | GPIO 34 (ADC) |
| pH Sensor | GPIO 35 (ADC) |
| Water Sensor | GPIO 32 (ADC) |
| NPK RX | GPIO 16 |
| NPK TX | GPIO 17 |
| LM393 Out 1 | GPIO 13 |
| LM393 Out 2 | GPIO 14 |
| Q-LED | GPIO 2 |
