// CROP-CARE-CREW: Advanced Smart Farming Hub
// Components: Arduino Uno, DHT11, Moisture Sensor, Water Level Sensor, pH Sensor, NPK Sensor (RS485)

#include <DHT.h>
#include <SoftwareSerial.h>

// --- PIN DEFINITIONS ---
// Digital Pins
#define DHT_PIN 2
#define RELAY_PIN 8
#define RE_DE_PIN 7      // For MAX485 (NPK Sensor)

// Analog Pins
#define SOIL_MOISTURE_PIN A0
#define PH_SENSOR_PIN A1
#define WATER_LEVEL_PIN A2

// Software Serial for NPK Sensor (RS485)
// RO -> Pin 10 (RX), DI -> Pin 11 (TX)
SoftwareSerial modbus(10, 11); 

// --- SENSOR CONFIGURATION ---
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Modbus request frames for NPK (Standard RS485 NPK Sensor)
const byte nitro_req[] = {0x01,0x03, 0x00, 0x1e, 0x00, 0x01, 0xe4, 0x0c};
const byte phos_req[] = {0x01,0x03, 0x00, 0x1f, 0x00, 0x01, 0xb5, 0xcc};
const byte pota_req[] = {0x01,0x03, 0x00, 0x20, 0x00, 0x01, 0x85, 0xc0};

byte values[11];

void setup() {
  Serial.begin(9600);    // For printing to PC
  modbus.begin(9600);    // For NPK sensor communication
  
  // Pin Modes
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(WATER_LEVEL_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);
  
  pinMode(RE_DE_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  
  // Initialize states
  digitalWrite(RELAY_PIN, HIGH); // Relay OFF (Assuming Active LOW)
  digitalWrite(RE_DE_PIN, LOW);  // Set MAX485 to Receive mode
  
  dht.begin();
  
  Serial.println("=========================================");
  Serial.println("CROP-CARE-CREW: Advanced Sensor Hub Started");
  Serial.println("=========================================");
}

void loop() {
  // 1. Read DHT11
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // 2. Read Analog Sensors
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  int waterLevelRaw = analogRead(WATER_LEVEL_PIN);
  
  // 3. Read pH Sensor
  // Basic pH calculation (Requires calibration for accuracy)
  int phRaw = analogRead(PH_SENSOR_PIN);
  float voltage = phRaw * (5.0 / 1023.0);
  float phValue = 3.5 * voltage; // Approximate conversion, adjust with calibration liquid
  
  // Convert Moisture to Percentage
  int moisturePercent = map(soilMoistureRaw, 1023, 300, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
  
  // Convert Water Level to Percentage
  int waterPercent = map(waterLevelRaw, 0, 700, 0, 100);
  waterPercent = constrain(waterPercent, 0, 100);

  // 4. Read NPK Sensor
  byte val1, val2, val3;
  val1 = getNPKData(nitro_req);
  delay(250);
  val2 = getNPKData(phos_req);
  delay(250);
  val3 = getNPKData(pota_req);
  delay(250);

  // --- PRINT ALL DATA ---
  Serial.print("DATA|");
  Serial.print("Temp:"); Serial.print(temperature); Serial.print("|");
  Serial.print("Hum:"); Serial.print(humidity); Serial.print("|");
  Serial.print("Moist:"); Serial.print(moisturePercent); Serial.print("|");
  Serial.print("WaterLvl:"); Serial.print(waterPercent); Serial.print("|");
  Serial.print("pH:"); Serial.print(phValue); Serial.print("|");
  Serial.print("N:"); Serial.print(val1); Serial.print("|");
  Serial.print("P:"); Serial.print(val2); Serial.print("|");
  Serial.print("K:"); Serial.println(val3);

  // --- BASIC IRRIGATION LOGIC ---
  if (moisturePercent < 30 && waterPercent > 10) { 
    // If soil is dry AND we have water in the tank
    Serial.println("STATUS|Action: Watering Plant...");
    digitalWrite(RELAY_PIN, LOW); // Pump ON
    delay(3000);
    digitalWrite(RELAY_PIN, HIGH); // Pump OFF
    delay(5000); // Let it soak
  } else if (waterPercent <= 10) {
    Serial.println("STATUS|Warning: Water tank is empty! Cannot irrigate.");
  }

  delay(2000);
}

// Function to read NPK values via MAX485
byte getNPKData(const byte req[]) {
  digitalWrite(RE_DE_PIN, HIGH); // Transmit Mode
  delay(10);
  if(modbus.write(req, 8) == 8) {
    digitalWrite(RE_DE_PIN, LOW); // Receive Mode
    for(byte i=0; i<7; i++) {
      values[i] = modbus.read();
    }
  }
  return values[4]; // The actual N, P, or K value is at index 4
}
