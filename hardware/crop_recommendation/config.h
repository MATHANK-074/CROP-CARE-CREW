#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_URL = "http://YOUR_SERVER_IP:5005/api/hardware/telemetry";

// Sensor Pin Definitions
#define DHT_PIN 4
#define DHT_TYPE DHT11 // or DHT22
#define SOIL_MOISTURE_PIN 34 // Analog pin
#define PH_SENSOR_PIN 35 // Analog pin
#define WATER_SENSOR_PIN 32 // Analog pin

// NPK Sensor (typically communicates via RS485/Modbus, using SoftwareSerial or HardwareSerial)
#define NPK_RX_PIN 16
#define NPK_TX_PIN 17

// LM393 Dual Comparator (usually gives digital output based on a threshold)
#define LM393_OUT1_PIN 13 
#define LM393_OUT2_PIN 14

// Q-LED (Indicator LED)
#define Q_LED_PIN 2

// Data collection interval (in milliseconds)
#define READ_INTERVAL 60000 // 60 seconds

#endif // CONFIG_H
