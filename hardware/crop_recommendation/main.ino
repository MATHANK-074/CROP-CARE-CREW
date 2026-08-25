#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include "config.h"

// Initialize DHT sensor
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize sensors and pins
  dht.begin();
  pinMode(Q_LED_PIN, OUTPUT);
  pinMode(LM393_OUT1_PIN, INPUT);
  pinMode(LM393_OUT2_PIN, INPUT);
  
  // Connect to WiFi
  connectWiFi();
}

void loop() {
  if (millis() - lastReadTime > READ_INTERVAL) {
    lastReadTime = millis();
    
    // Ensure WiFi is connected
    if(WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }
    
    // Read Sensors
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
    int phRaw = analogRead(PH_SENSOR_PIN);
    int waterLevelRaw = analogRead(WATER_SENSOR_PIN);
    
    int lm393_1 = digitalRead(LM393_OUT1_PIN);
    int lm393_2 = digitalRead(LM393_OUT2_PIN);

    // TODO: Implement actual NPK reading logic (e.g. via Modbus RS485 using SoftwareSerial)
    int n = 0;
    int p = 0;
    int k = 0;

    // Convert raw analog readings to percentage / meaningful values
    // Assuming 4095 is dry, 0 is wet for standard ESP32 12-bit ADC
    float soilMoisturePercent = map(soilMoistureRaw, 4095, 0, 0, 100);
    
    // Build JSON Payload
    String payload = "{";
    payload += "\"temperature\":" + String(temperature) + ",";
    payload += "\"humidity\":" + String(humidity) + ",";
    payload += "\"soilMoisture\":" + String(soilMoisturePercent) + ",";
    payload += "\"phRaw\":" + String(phRaw) + ",";
    payload += "\"waterLevelRaw\":" + String(waterLevelRaw) + ",";
    payload += "\"n\":" + String(n) + ",";
    payload += "\"p\":" + String(p) + ",";
    payload += "\"k\":" + String(k);
    payload += "}";
    
    Serial.println("Sending data: " + payload);
    
    // Send to server
    sendData(payload);
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  // Turn LED on while connecting
  digitalWrite(Q_LED_PIN, HIGH);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Turn LED off when connected
  digitalWrite(Q_LED_PIN, LOW);
}

void sendData(String payload) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    
    // Blink LED to indicate transmission
    digitalWrite(Q_LED_PIN, HIGH);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    
    digitalWrite(Q_LED_PIN, LOW);
    http.end();
  } else {
    Serial.println("Error in WiFi connection");
  }
}
