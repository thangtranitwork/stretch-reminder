# Stretch & Break Reminder (GNOME Shell Extension)

A smart, native GNOME Shell extension that helps developers and power users prevent Repetitive Strain Injury (RSI) and eye strain. It prompts you to stand up, stretch, and rest your eyes periodically.

## Features
- **🧘 Smart Inactivity Detection**: Uses GNOME's native idle monitor (`Mutter.IdleMonitor`). If you step away from your PC for a while, the timer automatically pauses. When you return, it resets the block so you aren't forced to take a break immediately after sitting down.
- **🖥️ Full-Screen Break Overlay**: Dims your monitors gently and blocks mouse/keyboard interaction briefly to encourage you to step away.
- **💡 Quick Stretching Tips**: Shows random healthy stretching exercises and screen-break advice during your rest period.
- **⚙️ Customizable Settings**: Adjust work duration, break duration, and idle sensitivity threshold from the Extension Preferences.

## Installation

### Manual Installation
Clone or copy this directory to your GNOME Shell extensions folder:
```bash
cp -r stretch-reminder@local ~/.local/share/gnome-shell/extensions/
```

Compile the GSettings schema:
```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/stretch-reminder@local/schemas/
```

Restart GNOME Shell (`Alt + F2` -> `r` on X11, or log out and log back in on Wayland) and enable the extension:
```bash
gnome-extensions enable stretch-reminder@local
```
