# CROP-CARE-CREW: Advanced Smart Farming Hub 🌿💻

This folder contains the Arduino code (`smart_irrigation.ino`) for setting up an Advanced Soil and Climate monitoring hub using an **Arduino Uno**.

## Required Hardware Components
1. **Arduino Uno** 
2. **Analog Soil Moisture Sensor** 
3. **DHT11 Temperature & Humidity Sensor**
4. **Water Level Sensor** (Analog)
5. **pH Sensor** (e.g., pH-4502C module)
6. **Soil NPK Sensor** (Requires a **MAX485/RS485 to TTL module** to connect to Arduino)
7. **5V Relay Module** & **Mini Submersible Water Pump**
8. **Jumper Wires**, **Breadboard**, **Power Supply**

---

## Circuit Connections 🔌

### 1. DHT11 Sensor (Temperature & Humidity)
* **VCC:** 5V | **GND:** GND | **DATA:** Digital Pin `2`

### 2. Soil Moisture Sensor
* **VCC:** 5V | **GND:** GND | **A0 (Analog):** Analog Pin `A0`

### 3. pH Sensor (pH-4502C)
* **VCC:** 5V | **GND:** GND | **Po (Analog Out):** Analog Pin `A1`

### 4. Water Level Sensor
* **VCC:** 5V | **GND:** GND | **S (Signal):** Analog Pin `A2`

### 5. NPK Sensor (via MAX485 TTL to RS485 Module)
*Since the NPK sensor uses RS485 communication, we must use a MAX485 module.*
* **MAX485 VCC:** 5V | **MAX485 GND:** GND
* **MAX485 RO (Receiver Output):** Digital Pin `10`
* **MAX485 DI (Driver Input):** Digital Pin `11`
* **MAX485 RE & DE:** Connect BOTH to Digital Pin `7`
* **MAX485 A & B:** Connect to the `A` and `B` wires of the NPK sensor.
*(Note: Most NPK sensors require a separate 9V-24V power supply for their brown/black wires. DO NOT power the NPK sensor directly from Arduino 5V).*

### 6. Relay Module & Water Pump
* **Relay VCC:** 5V | **Relay GND:** GND | **IN (Signal):** Digital Pin `8`
* Connect Pump's Ground to Battery Ground. Connect Pump's Positive to Relay `NO`. Connect Battery Positive to Relay `COM`.

---

## How to Install & Run the Code 💻
1. Open the `smart_irrigation.ino` file in Arduino IDE.
2. Ensure you have installed the **DHT Sensor Library** via Library Manager.
3. The `SoftwareSerial` library is built-in.
4. Upload the code to your Arduino Uno.
5. Open the **Serial Monitor** (set to 9600 baud rate).

## What to Expect
In the Serial Monitor, you should see a string like this printed every few seconds:
`DATA|Temp:28.5|Hum:65.0|Moist:45|WaterLvl:80|pH:6.8|N:25|P:30|K:40`

The code also has smart logic built-in:
* If the Soil Moisture is low (dry) **AND** the Water Level sensor detects water in your tank, it will turn the pump ON for 3 seconds.
* If the tank is empty, it will print a Warning and will not turn on the pump, saving the motor from burning out!
