# TaskFlow App Assets

This folder contains the visual assets for the TaskFlow app.

## Required Assets

You need to create the following image files:

### 1. App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Design**: TaskFlow logo/checkmark icon on transparent or purple (#6c5ce7) background
- **Tool**: Use [Figma](https://figma.com), Canva, or Adobe Illustrator

### 2. Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Design**: Same as icon.png but ensure important content is in the safe zone (center 66%)
- **Background**: Will use #6c5ce7 (configured in app.json)

### 3. Splash Screen (`splash.png`)
- **Size**: 1284x2778 pixels (or 2048x2048 for square)
- **Format**: PNG
- **Background**: #6c5ce7 (purple)
- **Design**: TaskFlow logo/wordmark centered

### 4. Favicon (`favicon.png`)
- **Size**: 48x48 pixels
- **Format**: PNG
- **Design**: Simplified version of the app icon

## Quick Asset Generation

### Option 1: Use Figma Template
1. Go to [Expo Icon Generator](https://www.figma.com/community/file/1155362909441341285)
2. Duplicate the template
3. Replace with TaskFlow branding (purple #6c5ce7)
4. Export as PNG

### Option 2: Use Online Tools
- [Icon Kitchen](https://icon.kitchen/) - Generate all app icons at once
- [App Icon Generator](https://appicon.co/) - Quick icon generation
- [Canva](https://www.canva.com/) - Design from scratch

### Option 3: AI Generation
Use AI tools like:
- Midjourney: "minimalist task management app icon, purple and white, checkmark, modern, flat design"
- DALL-E: "app icon for todo list app, purple gradient, simple checkmark"
- Stable Diffusion

## Temporary Placeholders

Until you create proper assets, you can use these placeholder commands:

### Generate Simple Placeholder Icons (requires ImageMagick)

```bash
# Icon (1024x1024)
convert -size 1024x1024 xc:"#6c5ce7" \
  -gravity center -pointsize 400 -fill white -annotate +0+0 "✓" \
  icon.png

# Splash (1284x2778)
convert -size 1284x2778 xc:"#6c5ce7" \
  -gravity center -pointsize 120 -fill white -annotate +0-200 "TaskFlow" \
  -pointsize 400 -annotate +0+200 "✓" \
  splash.png

# Adaptive Icon (1024x1024)
cp icon.png adaptive-icon.png

# Favicon (48x48)
convert icon.png -resize 48x48 favicon.png
```

### Or Use Expo's Default Icons

If you want to start immediately, you can temporarily copy Expo's default icon:

```bash
npx expo install expo-constants
# Then Expo will use default icon until you replace it
```

## Design Guidelines

### Color Palette
- **Primary**: #6c5ce7 (Purple)
- **Secondary**: #ffffff (White)
- **Accent**: #5549c7 (Darker purple)

### Icon Style
- Minimalist and modern
- Clear at small sizes
- Represents task completion (checkmark/tick)
- Consistent with app's purple theme

### Brand Identity
- **Font**: San Francisco (iOS) / Roboto (Android) - clean, modern
- **Style**: Minimal, productive, professional
- **Mood**: Efficient, calm, organized

## Validation

Before building, validate your assets:

```bash
# Check if all required files exist
ls -lh icon.png adaptive-icon.png splash.png favicon.png

# Check image dimensions
file icon.png splash.png
```

## Next Steps

1. Create or generate the required assets
2. Place them in this `/assets` folder
3. Run `npx expo start` to preview
4. Build with `eas build --platform android --profile preview`

