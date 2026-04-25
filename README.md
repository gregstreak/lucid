# Lucid — Migraine Pattern Tracker

Built by a migraineur who wanted to understand what was actually happening — not just manage what kept going wrong.

## What it does

Lucid is a PWA (Progressive Web App) migraine tracker that logs your daily protocol, exercise, sleep, hydration, nutrition, and migraine events — then identifies patterns in your own data after 20 entries.

## Features

- Daily log — protocol compliance, swim/exercise tracking with water temperature, sleep, hydration (with caffeine split), nutrition flags, optional detailed food diary
- Event log — migraine and pre-migraine logging with onset time, severity, warning signs, treatment, timing, and outcome
- Dashboard — monthly calendar view, barometric pressure with live data, protocol streak, progress to first analysis, emerging patterns
- Doctor report — structured 90-day summary for clinical consultations, with PDF export (coming)
- PWA — installs to home screen on iOS and Android, works offline

## Tech

- Vanilla HTML/CSS/JS — no framework dependencies
- Local Storage for data persistence
- Open-Meteo API for barometric pressure (free, no key required)
- Service Worker for offline support
- Google Fonts — EB Garamond + DM Sans

## Deploy to Vercel / Netlify

1. Push this folder to a GitHub repository
2. Connect the repo to Vercel or Netlify
3. Deploy — no build step required, it's static HTML

## Install as PWA on iPhone

1. Open the deployed URL in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The Lucid icon appears on your home screen

## Install as PWA on Android

1. Open the deployed URL in Chrome
2. Tap the three-dot menu
3. Select "Add to Home Screen" or "Install App"

## Icons

Replace `icons/icon-192.png` and `icons/icon-512.png` with PNG exports of `icons/icon.svg` at the appropriate sizes for proper home screen icons.

You can use any SVG-to-PNG converter, or open `icons/icon.svg` in a browser and screenshot at the right dimensions.

## Roadmap

- [ ] Supabase backend for multi-user data
- [ ] AI pattern analysis at 20 entries (Anthropic API)
- [ ] PDF doctor report export
- [ ] Push notifications for daily log reminder
- [ ] Community insights layer
- [ ] App Store / Play Store submission

## Colour palette

| Name | Hex | Use |
|------|-----|-----|
| Teal dark | #1A6B54 | Primary brand, buttons, icon background |
| Teal | #2A9D7C | Active states, protocol compliance |
| Teal light | #F0F8F6 | Backgrounds, clean day indicators |
| Dawn peach | #E8A87C | Analysis moments, insights, near-miss days |
| Coral | #D85A30 | Migraine events, missed days, alerts |
| Warm white | #F5F2EC | App background throughout |

---

*Lucid is not a medical device. It identifies correlational patterns in user-logged data. Always consult a medical professional regarding diagnosis and treatment.*
