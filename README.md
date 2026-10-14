# 💧 Aqua Sense — Smart Irrigation for Pakistani Farmers

**Live demo:** https://aquasense2k26.netlify.app

Aqua Sense helps farmers decide **when** and **how much** to irrigate using weather forecasts, crop needs and soil conditions. It saves water, reduces cost (in PKR) and gives advice in **English, Urdu and Sindhi**.

> Agriculture uses most of Pakistan's fresh water. Small improvements in irrigation timing can save a lot of it.

## ✨ Features

### 1. AquaLeaf Smart Window (core)
- Enter an address or use GPS (geocoded to latitude/longitude).
- Choose crop, growth stage, soil type, field size and last irrigation date.
- Fetches the **hourly 7-day forecast**: temperature, wind, rain probability, precipitation and evapotranspiration (ET₀).
- Transparent rule-based model: **ETc = ET₀ × Kc**, reduced by rainfall and estimated soil moisture.
- Scores every hour and day (temperature, wind, rain, time of day, soil moisture deficit).
- One clear recommendation, such as *"Irrigate tomorrow from 5:00 AM to 7:00 AM"*, with a plain-language reason.
- Water need in **mm** and **liters per acre**, plus water saved vs a fixed schedule.
- 7-day color calendar: 🟩 no irrigation · 🟨 optional/light · 🟥 irrigate · 🟦 rain expected.
- Main recommendations in **English / اردو / سنڌي**.

### 2. Current Weather
Location, condition icon, temperature, feels-like, humidity, wind speed and direction, rain chance, sunrise and sunset.

### 3. LeafHydra
Upload or capture a leaf photo and get a hydration status, a 0–100 hydration index, a confidence score and the visual signs detected.
Analysis runs **in the browser** (color and texture analysis), so photos never leave the device.
> This is a visual estimate, not a direct measurement of leaf water content.

| Index | Status |
|---|---|
| 80–100 | Well hydrated |
| 60–79 | Mild stress |
| 40–59 | Moderate stress |
| 0–39 | Severe stress |

### 4. WaterWallet
Log each irrigation, see usage for this week, month and season, compare with the crop's estimated requirement, and see potential water and **cost savings in PKR**.

### Extras
PDF report of the 7-day plan, sample leaf photos for demos, "How it works" and "About" sections.

## 🧰 Tech Stack
- React + Vite
- [Open-Meteo](https://open-meteo.com/) forecast and geocoding APIs (no API key needed)
- Rule-based crop-water model (FAO-56 style crop coefficients)
- Browser `localStorage` for WaterWallet data
- Deployed on Netlify

## 🚀 Run Locally
```bash
npm install
npm run dev
```
Build for production:
```bash
npm run build
```

## ⚠️ Limitations
- Recommendations are estimates to support, not replace, a farmer's judgment.
- LeafHydra is a rule-based visual estimate, not a trained AI model.
- WaterWallet data is stored only in the current browser (no accounts or cloud sync yet).

## 🔮 Future Work
Farmer accounts and cloud sync, SMS/WhatsApp irrigation alerts, a trained leaf-stress model, and soil sensor integration.

## 🙏 Credits
Weather data by Open-Meteo.
