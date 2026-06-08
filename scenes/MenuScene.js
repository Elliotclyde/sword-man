// Menu screen configuration with displayable items
const MENU_SCREENS = {
  menu: {
    items: [
      { displayName: "Play", key: "play" },
      { displayName: "Credits", key: "credits" },
    ],
  },
  credits: {
    text: "created by Hugh Haworth",
    textUrl: "https://www.elliotclyde.nz",
    music: "music by Hugh Haworth",
    voiceActing: "voice-acting by Hugh Haworth",
    sprites: [
      {
        title: "Tiny RPG Character Asset Pack",
        url: "https://zerie.itch.io/tiny-rpg-character-asset-pack",
      },
      {
        title: "Beholder Monsters Top-Down Pixel Art Sprites",
        url: "https://free-game-assets.itch.io/beholder-monsters-top-down-pixel-art-sprites",
      },
      {
        title: "Dungeon Asset Pack",
        url: "https://pixel-poem.itch.io/dungeon-assetpuck",
      },
    ],
  },
};

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  preload() {
    // Load castle background image
    this.load.image("castle", "assets/castle.png");
  }

  create() {
    // Initialize menu state
    this.currentScreen = "menu";
    this.currentMenuIndex = 0; // Start with "Play" focused
    this.menuItems = MENU_SCREENS.menu.items;

    // Add castle background
    this.add.image(400, 300, "castle").setDisplaySize(800, 600);

    // Set background color to black
    this.cameras.main.setBackgroundColor("#000000");

    // Display the menu
    this.displayMenu();

    // Set up keyboard input
    this.setupInput();
  }

  setupInput() {
    // Get keyboard input
    this.input.keyboard.on("keydown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (this.currentScreen === "menu") {
          this.handleMenuNavigation(event.key);
        } else if (this.currentScreen === "credits") {
          this.handleCreditsNavigation(event.key);
        }
      } else if (event.key === "Enter" || event.key === " ") {
        this.handleMenuSelect();
      }
    });
  }

  handleMenuNavigation(key) {
    if (key === "ArrowUp") {
      this.currentMenuIndex =
        (this.currentMenuIndex - 1 + this.menuItems.length) %
        this.menuItems.length;
    } else if (key === "ArrowDown") {
      this.currentMenuIndex =
        (this.currentMenuIndex + 1) % this.menuItems.length;
    }
    this.displayMenu();
  }

  handleCreditsNavigation(key) {
    // Calculate total items: 1 created by + sprites + 1 back button
    const totalItems = MENU_SCREENS.credits.sprites.length + 2;

    if (key === "ArrowUp") {
      this.currentCreditsIndex =
        (this.currentCreditsIndex - 1 + totalItems) % totalItems;
    } else if (key === "ArrowDown") {
      this.currentCreditsIndex = (this.currentCreditsIndex + 1) % totalItems;
    }
    this.displayMenu();
  }

  handleMenuSelect() {
    if (this.currentScreen === "menu") {
      const selectedItem = this.menuItems[this.currentMenuIndex];
      switch (selectedItem.key) {
        case "play":
          this.scene.start("MainScene");
          break;
        case "credits":
          this.currentScreen = "credits";
          this.currentCreditsIndex = 0; // Start with first sprite focused
          this.displayMenu();
          break;
      }
    } else if (this.currentScreen === "credits") {
      // Check if back button is selected
      const totalItems = MENU_SCREENS.credits.sprites.length + 2;
      if (this.currentCreditsIndex === totalItems - 1) {
        // Back button is selected
        this.currentScreen = "menu";
        this.currentMenuIndex = 0;
        this.clearAllElements();
        this.displayMenu();
      } else if (this.currentCreditsIndex === 0) {
        // Open the created by link
        window.open(MENU_SCREENS.credits.textUrl, "_blank");
      } else {
        // Open the sprite link
        const sprite =
          MENU_SCREENS.credits.sprites[this.currentCreditsIndex - 1];
        window.open(sprite.url, "_blank");
      }
    }
  }

  displayMenu() {
    this.clearAllElements();

    if (this.currentScreen === "menu") {
      this.displayMainMenu();
    } else if (this.currentScreen === "credits") {
      this.displayCreditsScreen();
    }
  }

  clearAllElements() {
    // Clear all text elements
    if (this.menuTitle) {
      this.menuTitle.destroy();
    }
    if (this.menuItemsTexts) {
      this.menuItemsTexts.forEach((text) => text.destroy());
    }
    if (this.creditsText) {
      this.creditsText.destroy();
    }
    if (this.musicText) {
      this.musicText.destroy();
    }
    if (this.voiceActingText) {
      this.voiceActingText.destroy();
    }
    if (this.spritesHeadingText) {
      this.spritesHeadingText.destroy();
    }
    if (this.spriteCreditsTexts) {
      this.spriteCreditsTexts.forEach((text) => text.destroy());
    }
    if (this.backButton) {
      this.backButton.destroy();
    }
  }

  displayMainMenu() {
    const centerX = 400;
    const startY = 250;
    const spacing = 80;

    // Display title
    this.menuTitle = this.add.text(centerX, 150, "THIS DUNGEON ETERNAL", {
      fontSize: "48px",
      fill: "#ffffff",
    });
    this.menuTitle.setOrigin(0.5);

    // Display menu items
    this.menuItemsTexts = [];
    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.currentMenuIndex;
      const alpha = isSelected ? 1.0 : 0.5; // Transparent when not selected
      const yPosition = startY + index * spacing;

      const text = this.add.text(centerX, yPosition, item.displayName, {
        fontSize: "64px",
        fill: "#ffffff",
      });
      text.setOrigin(0.5);
      text.setAlpha(alpha);

      this.menuItemsTexts.push(text);
    });
  }

  displayCreditsScreen() {
    const centerX = 400;
    const centerY = 150;

    // Display main credits text as interactive element
    const isCreatedBySelected = this.currentCreditsIndex === 0;
    const createdByAlpha = isCreatedBySelected ? 1.0 : 0.5;

    this.creditsText = this.add.text(
      centerX,
      centerY,
      MENU_SCREENS.credits.text,
      {
        fontSize: "36px",
        fill: "#ffffff",
      },
    );
    this.creditsText.setOrigin(0.5);
    this.creditsText.setAlpha(createdByAlpha);
    this.creditsText.setInteractive();
    this.creditsText.on("pointerdown", () => {
      window.open(MENU_SCREENS.credits.textUrl, "_blank");
    });
    this.creditsText.on("pointerover", () => {
      this.creditsText.setAlpha(1.0);
      this.game.canvas.style.cursor = "pointer";
    });
    this.creditsText.on("pointerout", () => {
      const isCurrentSelected = this.currentCreditsIndex === 0;
      this.creditsText.setAlpha(isCurrentSelected ? 1.0 : 0.5);
      this.game.canvas.style.cursor = "default";
    });

    // Display music credits
    this.musicText = this.add.text(
      centerX,
      centerY + 60,
      MENU_SCREENS.credits.music,
      {
        fontSize: "24px",
        fill: "#ffffff",
      },
    );
    this.musicText.setOrigin(0.5);

    // Display voice-acting credits
    this.voiceActingText = this.add.text(
      centerX,
      centerY + 100,
      MENU_SCREENS.credits.voiceActing,
      {
        fontSize: "24px",
        fill: "#ffffff",
      },
    );
    this.voiceActingText.setOrigin(0.5);

    // Display sprites subheading
    this.spritesHeadingText = this.add.text(centerX, centerY + 160, "Sprites", {
      fontSize: "28px",
      fill: "#ffffff",
    });
    this.spritesHeadingText.setOrigin(0.5);

    // Display sprite credits
    this.spriteCreditsTexts = [];
    const sprites = MENU_SCREENS.credits.sprites;
    let yOffset = centerY + 190;

    sprites.forEach((sprite, index) => {
      const isSelected = index + 1 === this.currentCreditsIndex;
      const alpha = isSelected ? 1.0 : 0.5;

      const spriteText = this.add.text(centerX, yOffset, sprite.title, {
        fontSize: "16px",
        fill: "#ffffff",
        align: "center",
      });
      spriteText.setOrigin(0.5);
      spriteText.setAlpha(alpha);
      spriteText.setInteractive();
      spriteText.on("pointerdown", () => {
        window.open(sprite.url, "_blank");
      });
      spriteText.on("pointerover", () => {
        spriteText.setAlpha(1.0);
        this.game.canvas.style.cursor = "pointer";
      });
      spriteText.on("pointerout", () => {
        const isCurrentSelected = this.currentCreditsIndex === index + 1;
        spriteText.setAlpha(isCurrentSelected ? 1.0 : 0.5);
        this.game.canvas.style.cursor = "default";
      });
      this.spriteCreditsTexts.push(spriteText);
      yOffset += 20;
    });

    // Display back button
    const isBackSelected = this.currentCreditsIndex === sprites.length + 1;
    const backAlpha = isBackSelected ? 1.0 : 0.5;

    this.backButton = this.add.text(centerX, yOffset + 20, "Back", {
      fontSize: "24px",
      fill: "#ffffff",
      align: "center",
    });
    this.backButton.setOrigin(0.5);
    this.backButton.setAlpha(backAlpha);
    this.backButton.setInteractive();
    this.backButton.on("pointerdown", () => {
      this.currentScreen = "menu";
      this.currentMenuIndex = 0;
      this.displayMenu();
    });
    this.backButton.on("pointerover", () => {
      this.backButton.setAlpha(1.0);
      this.game.canvas.style.cursor = "pointer";
    });
    this.backButton.on("pointerout", () => {
      const isSelected = this.currentCreditsIndex === sprites.length + 1;
      this.backButton.setAlpha(isSelected ? 1.0 : 0.5);
      this.game.canvas.style.cursor = "default";
    });
  }
}

export default MenuScene;
