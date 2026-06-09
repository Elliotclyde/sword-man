import MenuScene from "./scenes/MenuScene.js";
import MainScene from "./scenes/MainScene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    max: {
      width: 800,
      height: 600,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [MenuScene, MainScene],
};

export default config;
