# Workout Tracker

A beautiful, modern workout tracking progressive web app (PWA) built with React, TypeScript, and Tailwind CSS.

## Features

### 1. Workout Logging
- **Simple Interface**: Add exercises and sets with just a few clicks
- **Flexible Input**: Track reps and optional weights for each set
- **Date Selection**: Log workouts for any date
- **Notes**: Add personal observations about each workout
- **Real-time Validation**: Intelligent form handling

### 2. Previous Session Comparison
- **Side-by-side View**: Compare current workout with your last session
- **Progress Indicators**: Visual arrows showing improvements or decreases
- **Quick Reference**: See exactly what you did last time while logging

### 3. Progress Charts
- **Exercise Selection**: Choose any exercise to view detailed charts
- **Multiple Metrics**: Track total reps, volume (reps × weight), and max weight
- **Beautiful Visualizations**: Smooth, animated charts powered by Recharts
- **Trend Analysis**: Easily spot progress over time

### 4. Workout Streak & Heatmap
- **GitHub-style Heatmap**: Visual representation of your workout consistency
- **Streak Tracking**: Current streak, longest streak, and total workouts
- **Color-coded Intensity**: Darker colors for more intense workout sessions
- **Last 12 Weeks**: Overview of your recent activity

### 5. Import/Export
- **Plain Text Format**: Simple, human-readable format
- **UPSERT Logic**: Import data that merges with existing workouts
- **Multiple Options**: Download as file or copy to clipboard
- **Backup & Restore**: Never lose your workout data

## Tech Stack

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component system
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **PWA Support** - Install as native app

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Design

The app uses **#BF092F** as the primary color - a bold, energetic red that motivates action.

### Color System
- **Primary**: #BF092F (Workout Red)
- **Design Philosophy**: Clean, simple, and dumb-proof
- **Responsive**: Mobile-first design that works everywhere
- **PWA**: Install on any device for native-like experience

## Data Storage

All data is stored locally in your browser's localStorage. No account creation needed, no backend required, complete privacy.

### Data Format

Export format example:
```
Workout Log

Date: 2024-01-15

Pushups
40
40
40

Biceps
10 x 15kg
10 x 15kg

---
```

## Usage Tips

1. **Consistent Logging**: Log workouts immediately after completing them
2. **Use the Comparison**: Reference your previous session to set targets
3. **Track Progress**: Check the charts weekly to see your gains
4. **Maintain Streaks**: Keep an eye on the heatmap to stay motivated
5. **Backup Regularly**: Export your data periodically for safekeeping

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended for PWA)
- Firefox
- Safari
- Mobile browsers

## License

MIT

## Credits

Built with love for fitness enthusiasts who want a simple, beautiful way to track their progress.
