# Phaser.js Project

A simple Phaser 3 game project with no build step. Just open `index.html` in your browser to play!

## Project Structure

```
phaser-project/
├── index.html          # Main HTML file
├── config.js          # Game configuration
├── game.js            # Game entry point
├── scenes/
│   └── MainScene.js   # Main game scene
└── README.md          # This file
```

## Getting Started

1. Open `index.html` in a web browser
2. Use arrow keys to move the green square around
3. Start building your game by modifying the scenes!

## How to Use

- **Add new scenes**: Create a new file in `scenes/` with a class extending `Phaser.Scene`
- **Add assets**: Put images, sprites, and sounds in an `assets/` directory and load them in `preload()`
- **Modify the config**: Edit `config.js` to change game size, physics, or add new scenes

## Phaser Resources

- [Phaser Documentation](https://newdocs.phaser.io/)
- [Phaser Examples](https://labs.phaser.io/)
- [Phaser API](https://photonstorm.github.io/phaser3-docs/)

## No Build Step

This project uses Phaser from a CDN, so no build tools are required. Just serve the files with any HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server

# macOS with Python 2
python -m SimpleHTTPServer 8000
```

Then visit `http://localhost:8000` in your browser.
