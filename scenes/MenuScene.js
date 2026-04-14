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
  },
};

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // Initialize menu state
    this.currentScreen = "menu";
    this.currentMenuIndex = 0; // Start with "Play" focused
    this.menuItems = MENU_SCREENS.menu.items;

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
        }
      } else if (event.key === "Enter") {
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

  handleMenuSelect() {
    if (this.currentScreen === "menu") {
      const selectedItem = this.menuItems[this.currentMenuIndex];
      switch (selectedItem.key) {
        case "play":
          this.scene.start("MainScene");
          break;
        case "credits":
          this.currentScreen = "credits";
          this.displayMenu();
          break;
      }
    } else if (this.currentScreen === "credits") {
      // Return to menu from credits
      this.currentScreen = "menu";
      this.currentMenuIndex = 0;
      this.displayMenu();
    }
  }

  displayMenu() {
    // Clear previous text
    if (this.menuTitle) {
      this.menuTitle.destroy();
    }
    if (this.menuItemsTexts) {
      this.menuItemsTexts.forEach((text) => text.destroy());
    }
    if (this.creditsText) {
      this.creditsText.destroy();
    }
    if (this.backHintText) {
      this.backHintText.destroy();
    }

    if (this.currentScreen === "menu") {
      this.displayMainMenu();
    } else if (this.currentScreen === "credits") {
      this.displayCreditsScreen();
    }
  }

  displayMainMenu() {
    const centerX = 400;
    const startY = 250;
    const spacing = 80;

    // Display title
    this.menuTitle = this.add.text(centerX, 150, "SWORD MAN", {
      fontSize: "64px",
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
    const centerY = 300;

    // Display credits text
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

    // Display back hint
    this.backHintText = this.add.text(
      centerX,
      centerY + 150,
      "Press ENTER to go back",
      {
        fontSize: "24px",
        fill: "#ffffff",
        alpha: 0.5,
      },
    );
    this.backHintText.setOrigin(0.5);
  }
}

export default MenuScene;
