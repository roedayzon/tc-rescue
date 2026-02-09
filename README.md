[README.md](https://github.com/user-attachments/files/25189008/README.md)
# TC Rescue - Audio Start Timecode Calculator

A mobile-optimized Progressive Web App (PWA) for calculating Audio Start Timecode in DaVinci Resolve based on clap positions.

## 🎬 What It Does

TC Rescue helps video editors sync audio and video in DaVinci Resolve by calculating the correct **Audio Start Timecode** to set in Clip Attributes. Simply enter:
- The position of the clap in your audio file (minutes, seconds, frames)
- The timecode shown on video when the clap occurs
- Get the exact timecode to set in Resolve

## 📱 Features

- **Mobile-optimized** iOS-style interface
- **PWA** - Works offline, installable on phones
- **Multiple calculations** - Track multiple takes
- **Export to CSV** - Save all your calculations
- **Copy to clipboard** - Quick copy for pasting into Resolve
- Supports all common frame rates (23.976, 24, 25, 29.97, 30, 59.94, 60)

## 🚀 Quick Start

### Testing Locally

1. Clone this repository
2. Open `index.html` in a web browser
3. Or run a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000`

### Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose "main" branch and "/" (root) folder
5. Click Save
6. Your app will be live at `https://yourusername.github.io/tc-rescue/`

## 📲 Installing on iPhone

Once deployed to GitHub Pages:

1. Open the app URL in Safari on your iPhone
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app will appear on your home screen like a native app!

## 🍎 Path to App Store

To eventually submit to the App Store, you'll need to:

1. **Wrap the web app** using one of these tools:
   - [Capacitor](https://capacitorjs.com/) (recommended)
   - [Cordova](https://cordova.apache.org/)
   
2. **Add native features** if needed:
   - File system access
   - Native sharing
   - Camera/microphone (if you add features later)

3. **Build with Xcode**:
   ```bash
   # Using Capacitor
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add ios
   npx cap copy
   npx cap open ios
   ```

4. **Submit through App Store Connect**:
   - Requires Apple Developer Program membership ($99/year)
   - Prepare screenshots, description, icons
   - Submit for review

## 📁 Project Structure

```
tc-rescue/
├── index.html          # Main app (mobile-optimized)
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── icon-192.png       # App icon (192x192)
├── icon-512.png       # App icon (512x512)
├── generate_icons.py  # Script to generate placeholder icons
└── README.md          # This file
```

## 🎨 Customizing Icons

Replace the generated placeholder icons with your own:
- Create a 512x512px icon with your design
- Export as PNG at both 192x192 and 512x512
- Replace `icon-192.png` and `icon-512.png`

## 🔧 How It Works

The app calculates:
```
Audio Clap Position (frames) = (minutes × 60 + seconds) × fps + frames
Video Clap Position (frames) = timecode converted to frames
Audio Start TC = Video Clap Position - Audio Clap Position
```

The result is the timecode you need to set in:
**DaVinci Resolve → Clip Attributes → Timecode → Start**

## 📝 Example Usage

1. **Record your audio** with a clap at the beginning
2. **Note the clap position** in your DAW or audio software (e.g., 0 min, 5 sec, 12 frames)
3. **Note the timecode on video** when the clap slate closes (e.g., 02:30:05:00)
4. **Enter both values** into TC Rescue
5. **Copy the calculated Audio Start TC** (e.g., 02:29:59:12)
6. **In Resolve**: Right-click audio clip → Clip Attributes → Timecode → paste the Start TC
7. **Your audio is now synced!**

## 🐛 Known Limitations

- Currently non-drop frame only (drop frame support coming in v2)
- Negative timecodes clamp to 00:00:00:00
- Requires manual entry of clap positions

## 🤝 Contributing

Feel free to open issues or submit pull requests!

## 📄 License

MIT License - feel free to use and modify

## 💡 Tips

- For best accuracy, use frame-accurate audio software to find clap positions
- Double-check your project frame rate matches your footage
- Keep the app installed on your phone for quick access on set
- Export CSV files for record-keeping

---

Built with ❤️ for video editors who sync audio manually
