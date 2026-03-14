class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        // Define game levels
        this.levels = [
            { level: 1, orcCount: 5 },
            { level: 2, orcCount: 8 }
        ];

        // Current level index
        this.currentLevelIndex = 0;
    }

    preload() {
        // Load assets here
        // Soldier.png is 900x700, divided into 100x100 frames
        this.load.spritesheet('soldier', 'assets/Soldier.png', {
            frameWidth: 100,
            frameHeight: 100
        });

        // Orc.png is set up similarly to Soldier.png
        this.load.spritesheet('orc', 'assets/Orc.png', {
            frameWidth: 100,
            frameHeight: 100
        });

        // Dungeon.png is 160x160 with 16x16 tiles in a 10x10 grid
        this.load.spritesheet('dungeon', 'assets/Dungeon.png', {
            frameWidth: 16,
            frameHeight: 16
           });
       }

    // Idempotent initialization method that properly resets all game state
    initializeGame() {
        // Reset game over flag
        this.gameIsOver = false;

        // Remove win/lose text if it exists
        if (this.resultText) {
            this.resultText.setVisible(false);
            this.resultText.destroy();
            this.resultText = null;
        }

        // Remove play again button if it exists
        if (this.playAgainButton) {
            this.playAgainButton.setVisible(false);
            this.playAgainButton.destroy();
            this.playAgainButton = null;
        }

        // Remove space key listener if it exists
        if (this.spaceKeyListener) {
            this.spaceKeyListener.removeAllListeners();
            this.spaceKeyListener.destroy();
            this.spaceKeyListener = null;
        }

        // Reset player if it exists
        if (this.player) {
            this.player.setPosition(400, 300);
            this.player.health = 3;
            this.player.clearTint();
            this.player.alpha = 1; // Reset player transparency
            if (this.player.body) {
                this.player.body.setVelocity(0, 0);
            }
            // Reset player state flags
            this.isPlayerSwinging = false;
            this.isDashing = false;
            this.dashEndTime = 0;
            this.lastDashTime = 0;
            this.lastAttackTime = 0;
            this.playerLastHitTime = 0; // Reset player hit timer
        }

        // Hide hit effect if it exists
        if (this.hitEffect) {
            this.hitEffect.setVisible(false);
        }

        // Update health text if it exists
        if (this.healthText) {
            this.healthText.setText(`Health: ${this.player.health}`);
        }

        // Completely remove all existing orcs with multiple cleanup approaches
        if (this.orcs) {
            // Method 1: Destroy each orc individually with special handling for dying orcs
            const orcsToDestroy = [...this.orcs.children.entries]; // Create a copy to avoid iteration issues
            orcsToDestroy.forEach(orc => {
                if (orc && !orc.destroyed) {
                    // Clear any timers associated with the orc
                    if (orc.behaviorTimer) {
                        orc.behaviorTimer.remove(false);
                    }

                    // If orc has an ongoing tween (fade out), complete it immediately
                    if (orc.fadeTween) {
                        orc.fadeTween.complete();
                        orc.fadeTween = null;
                    }

                    // Remove all animation completion listeners
                    orc.off('animationcomplete-orc_die');
                    orc.off('animationcomplete-orc_axe');

                    // Stop any current animations
                    if (orc.anims) {
                        orc.anims.stop();
                    }

                    // Reset alpha in case it was modified by a tween
                    orc.alpha = 1;

                    // Force destroy the orc
                    orc.destroy();
                }
            });

            // Method 2: Clear the group
            this.orcs.clear();

            // Method 3: Create a fresh group to ensure no references remain
            this.orcs = this.add.group();
        } else {
            // Create the orcs group if it doesn't exist
            this.orcs = this.add.group();
        }

        // Spawn new orcs based on current level
        const orcCount = this.levels[this.currentLevelIndex].orcCount;
        for (let i = 0; i < orcCount; i++) {
            this.spawnOrc();
        }

        // Re-establish collision detection between player and orcs
        if (this.player && this.orcs) {
            this.physics.add.overlap(this.player, this.orcs, this.handlePlayerOrcCollision, null, this);
        }
    }

       checkWinCondition() {
           // Check if all orcs are defeated
           const livingOrcs = this.orcs.children.entries.filter(orc => !orc.destroyed);
           if (livingOrcs.length === 0) {
               // Check if there are more levels
               if (this.currentLevelIndex < this.levels.length - 1) {
                   // Advance to next level
                   this.currentLevelIndex++;
                   this.initializeGame();
               } else {
                   // All levels completed, win the game
                   this.winGame();
               }
           }
       }

winGame() {
        this.gameIsOver = true;
        // Display win text
        let winMessage = 'YOU WIN!';
        if (this.currentLevelIndex < this.levels.length - 1) {
            winMessage = `LEVEL ${this.levels[this.currentLevelIndex].level} COMPLETE!`;
        }

        this.resultText = this.add.text(400, 250, winMessage, {
            fontSize: '64px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.resultText.setOrigin(0.5);
        this.resultText.setDepth(10);

        // Create Play Again button
        this.playAgainButton = this.add.text(400, 350, 'Play Again', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#c19a6b',
            padding: {
                left: 20,
                right: 20,
                top: 10,
                bottom: 10
            }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Function to restart the game
        const restartGame = () => {
            // Hide the elements immediately
            if (this.resultText) {
                this.resultText.setVisible(false);
            }
            if (this.playAgainButton) {
                this.playAgainButton.setVisible(false);
            }

            // Remove the space key listener if it exists
            if (this.spaceKeyListener) {
                this.spaceKeyListener.removeAllListeners();
                this.spaceKeyListener.destroy();
                this.spaceKeyListener = null;
            }

            // Use a delayed call to ensure the event handler completes before reinitializing
            this.time.delayedCall(10, () => {
                this.currentLevelIndex = 0; // Reset to first level
                this.initializeGame();
            });
        };

        this.playAgainButton.on('pointerdown', restartGame);

        // Add keyboard listener for space key to restart the game
        this.spaceKeyListener = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKeyListener.on('down', restartGame);

        // Stop player movement
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
        }

        // Stop all orcs (in case any are still alive) and destroy them
        const orcsToDestroy = [...this.orcs.children.entries]; // Create a copy to avoid iteration issues
        orcsToDestroy.forEach(orc => {
            if (!orc.destroyed) {
                // Clear any pending behavior timers
                if (orc.behaviorTimer) {
                    orc.behaviorTimer.remove(false);
                }
                // Complete any fade tweens immediately
                if (orc.fadeTween) {
                    orc.fadeTween.complete();
                    orc.fadeTween = null;
                }
                // Remove all animation listeners
                orc.off('animationcomplete-orc_die');
                orc.off('animationcomplete-orc_axe');
                // Stop any current animations
                if (orc.anims) {
                    orc.anims.stop();
                }
                // Reset alpha in case it was modified by a tween
                orc.alpha = 1;
                // Destroy the orc
                orc.destroy();
            }
        });
        // Clear the orcs group
        this.orcs.clear();
    }

    create() {
        // Create a 20x20 grid of random dungeon tiles
        const tileSize = 16; // Each tile is 16x16
        const gridWidth = 20;
        const gridHeight = 20;
        const scaleX = 800 / (gridWidth * tileSize); // Scale to fit the game width
        const scaleY = 600 / (gridHeight * tileSize); // Scale to fit the game height
        const scale = Math.max(scaleX, scaleY); // Use the larger scale to fill the screen

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                // Pick a random frame from the 1x1 to 4x4 area (frames 0-15)
                const randomFrame = Phaser.Math.Between(6, 9);
                const tile = this.add.sprite(x * tileSize * scale, y * tileSize * scale, 'dungeon', randomFrame);
                tile.setScale(scale);
                tile.setOrigin(0, 0); // Position from top-left corner
                tile.setDepth(-10); // Render tiles under everything
            }
        }

        // Create game objects here
        // Create standing animation (frames 0-5 from the top row)
        this.anims.create({
            key: 'stand',
            frames: this.anims.generateFrameNumbers('soldier', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        // Create walking animation (frames 10-16 from the second row)
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'soldier', frame: 10 },
                { key: 'soldier', frame: 11 },
                { key: 'soldier', frame: 12 },
                { key: 'soldier', frame: 13 },
                { key: 'soldier', frame: 14 },
                { key: 'soldier', frame: 15 },
                { key: 'soldier', frame: 16 }
            ],
            frameRate: 10,
            repeat: -1
        });

        // Create sword swing animation (frames 18-23)
        this.anims.create({
            key: 'sword',
            frames: [
                { key: 'soldier', frame: 18 },
                { key: 'soldier', frame: 19 },
                { key: 'soldier', frame: 20 },
                { key: 'soldier', frame: 21 },
                { key: 'soldier', frame: 22 },
                { key: 'soldier', frame: 23 }
            ],
            frameRate: 10,
            repeat: 0
        });

        // Create Orc animations using same frame layout as soldier
        this.anims.create({
            key: 'orc_stand',
            frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'orc_walk',
            frames: [
                { key: 'orc', frame: 10 },
                { key: 'orc', frame: 11 },
                { key: 'orc', frame: 12 },
                { key: 'orc', frame: 13 },
                { key: 'orc', frame: 14 },
                { key: 'orc', frame: 15 },
                { key: 'orc', frame: 16 }
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'orc_sword',
            frames: [
                { key: 'orc', frame: 18 },
                { key: 'orc', frame: 19 },
                { key: 'orc', frame: 20 },
                { key: 'orc', frame: 21 },
                { key: 'orc', frame: 22 },
                { key: 'orc', frame: 23 }
            ],
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'orc_die',
            frames: [
                { key: 'orc', frame: 40 },
                { key: 'orc', frame: 41 },
                { key: 'orc', frame: 42 },
                { key: 'orc', frame: 43 }
            ],
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'orc_axe',
            frames: [
                { key: 'orc', frame: 24 },
                { key: 'orc', frame: 25 },
                { key: 'orc', frame: 26 },
                { key: 'orc', frame: 27 },
                { key: 'orc', frame: 28 },
                { key: 'orc', frame: 29 }
            ],
            frameRate: 10,
            repeat: 0
        });

         // Create a sprite from the soldier spritesheet
         // Use frame 0 (the first 100x100px from top-left)
         this.player = this.add.sprite(400, 300, 'soldier', 0);
         this.player.setScale(3);
         this.player.setDepth(0); // Player renders under orks

         // Initialize player health
         this.player.health = 3;

         this.gameIsOver = false;

         this.physics.add.existing(this.player);
         this.player.body.setCollideWorldBounds(true);
         this.player.body.setSize(20.4, 19.95, true);
         this.player.body.setOffset(40, 38);

         // Initialize the game state using our idempotent method
         this.initializeGame();

          // Add input controls
          this.cursors = this.input.keyboard.createCursorKeys();
          this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
          this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

          // Track last horizontal direction (default to right)
          this.lastHorizontalDirection = 'right';
          this.isPlayerSwinging = false; // Track if player is currently swinging sword
          this.isDashing = false; // Track if player is currently dashing
          this.dashEndTime = 0; // Track when the dash ends
          this.lastDashTime = 0; // Track when the last dash was used

          // Track last attack time
          this.lastAttackTime = 0; // Track when the last dash was used

          // Track last time player was hit
          this.playerLastHitTime = 0; // Track when the player was last hit by an orc

          // Set up collision detection for player taking damage from orcs
          //this.physics.add.overlap(this.player, this.orcs, this.handlePlayerDamage, null, this);
          this.physics.add.overlap(this.player, this.orcs, this.handlePlayerOrcCollision, null, this);

          // Create health display text
          this.healthText = this.add.text(750, 550, `Health: ${this.player.health}`, {
              fontSize: '32px',
              fill: '#ffffff',
              stroke: '#000000',
              strokeThickness: 4
          });
          this.healthText.setOrigin(1, 1); // Align to bottom right
          this.healthText.setScrollFactor(0); // Keep fixed on screen

          // Create fullscreen red overlay for hit effect (hidden by default)
          this.hitEffect = this.add.rectangle(0, 0, 800, 600, 0xff0000, 0.7);
          this.hitEffect.setOrigin(0, 0);
          this.hitEffect.setDepth(100); // Ensure it's on top
          this.hitEffect.setVisible(false);

          // Check win condition in case there are initially no orcs
          this.checkWinCondition();
    }

    spawnOrc() {
        // Create an orc at a random position
        const randomX = Phaser.Math.Between(50, 750);
        const randomY = Phaser.Math.Between(50, 550);
        const orc = this.add.sprite(randomX, randomY, 'orc', 0);
        orc.setScale(3);
        orc.setDepth(5); // Orcs render on top of player by default
        orc.play('orc_stand');

        this.physics.add.existing(orc);
        orc.body.setCollideWorldBounds(true);
        orc.body.setSize(20.4, 19.95, true);
        orc.body.setOffset(40, 38);

        // Initialize orc-specific properties
        orc.orcIsMoving = false;
        orc.orcDirection = { x: 0, y: 0 };
        orc.orcLastEdgeHitTime = 0;
        orc.orcLastHorizontalDirection = 'right';
        orc.orcIsDead = false;
        orc.orcIsAxeSwinging = false; // Track if orc is currently swinging axe
        orc.hasRecentlyAttacked = false;

        // Add orc to group
        this.orcs.add(orc);

        // Start the orc behavior cycle
        this.scheduleOrcBehaviorChange(orc);
    }

     update() {
       if (this.gameIsOver){
          return;
       }
          // Update game logic here
          let isMoving = false;
         let movingRight = false;
         let movingLeft = false;
         let movingVertical = false;

         // Check if dash is still active
         const isDashActive = this.time.now < this.dashEndTime;
         const dashSpeedMultiplier = isDashActive ? 3.5 : 1; // 3.5x speed while dashing

         if (this.cursors.left.isDown) {
             this.player.body.setVelocityX(-160 * dashSpeedMultiplier);
             isMoving = true;
             movingLeft = true;
             this.lastHorizontalDirection = 'left';
         } else if (this.cursors.right.isDown) {
             this.player.body.setVelocityX(160 * dashSpeedMultiplier);
             isMoving = true;
             movingRight = true;
             this.lastHorizontalDirection = 'right';
         } else {
             this.player.body.setVelocityX(0);
         }

         if (this.cursors.up.isDown) {
             this.player.body.setVelocityY(-160 * dashSpeedMultiplier);
             isMoving = true;
             movingVertical = true;
         } else if (this.cursors.down.isDown) {
             this.player.body.setVelocityY(160 * dashSpeedMultiplier);
             isMoving = true;
             movingVertical = true;
         } else {
             this.player.body.setVelocityY(0);
         }

         // Handle X key for dash
         if (Phaser.Input.Keyboard.JustDown(this.xKey)) {
             // Check if enough time has passed since last dash (0.5 second cooldown)
             if (this.time.now - this.lastDashTime >= 500) {
                 // Start dash for 150ms
                 this.dashEndTime = this.time.now + 150;
                 this.lastDashTime = this.time.now;
             }
         }

         // Handle space bar for sword swing
       if (Phaser.Input.Keyboard.JustDown(this.spaceBar) && this.time.now - this.lastAttackTime >= 700 ) {
             this.lastAttackTime = this.time.now;
             this.player.play('sword');
             this.isPlayerSwinging = true;

             // Set up callback to revert animation after sword swing completes
             this.player.once('animationcomplete-sword', () => {
                 this.isPlayerSwinging = false;
                 // Resume normal animations
                 if (isMoving) {
                     this.player.play('walk');
                 } else {
                     this.player.play('stand');
                 }
             });
         }

        // Only update animations if not currently playing sword animation
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'sword') {
            // Determine animation direction based on current or last horizontal input
            let shouldFaceLeft = false;
            if (movingLeft) {
                shouldFaceLeft = true;
            } else if (movingRight) {
                shouldFaceLeft = false;
            } else if (movingVertical) {
                // Use last horizontal direction for vertical movement
                shouldFaceLeft = this.lastHorizontalDirection === 'left';
            } else {
                // When idle, use last horizontal direction
                shouldFaceLeft = this.lastHorizontalDirection === 'left';
            }

            // Apply flip based on direction
            this.player.setFlipX(shouldFaceLeft);

            // Play walking animation when moving
            if (isMoving) {
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'walk') {
                    this.player.play('walk');
                }
            } else {
                // Play standing animation when idle
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'stand') {
                    this.player.play('stand');
                }
            }
        }

         // Update all orcs
         this.orcs.children.entries.forEach(orc => {
             if (orc.destroyed) return;

             // Update orc movement
             if (!orc.orcIsDead) {
                 if (orc.orcIsMoving) {
                     orc.body.setVelocity(orc.orcDirection.x * 160, orc.orcDirection.y * 160);
                 } else {
                     orc.body.setVelocity(0, 0);
                 }
             }

            // Update orc animations and direction
            let orcShouldFaceLeft = false;

            // Update horizontal direction based on movement
            if (orc.orcDirection.x > 0) {
                // Moving right
                orcShouldFaceLeft = false;
                orc.orcLastHorizontalDirection = 'right';
            } else if (orc.orcDirection.x < 0) {
                // Moving left
                orcShouldFaceLeft = true;
                orc.orcLastHorizontalDirection = 'left';
            } else if (orc.orcDirection.y !== 0) {
                // Moving vertically only, use last horizontal direction
                orcShouldFaceLeft = orc.orcLastHorizontalDirection === 'left';
            } else {
                // Not moving, use last horizontal direction
                orcShouldFaceLeft = orc.orcLastHorizontalDirection === 'left';
            }

            // Apply flip based on direction
            orc.setFlipX(orcShouldFaceLeft);

             // Play animations
             if (!orc.orcIsDead && !orc.orcIsAxeSwinging) {
                 // Check if player is nearby (within 100 pixels)
                 const distanceToPlayer = Phaser.Math.Distance.Between(orc.x, orc.y, this.player.x, this.player.y);

                 if (distanceToPlayer < 100) {
                     // Player is nearby, play axe animation
                     if (!orc.anims.isPlaying || orc.anims.currentAnim.key !== 'orc_axe') {
                         orc.play('orc_axe');
                         orc.orcIsAxeSwinging = true;

                         // Set up callback to revert animation after axe swing completes
                         orc.once('animationcomplete-orc_axe', () => {
                             orc.orcIsAxeSwinging = false;
                             // Resume normal animations
                             if (orc.orcIsMoving) {
                                 orc.play('orc_walk');
                             } else {
                                 orc.play('orc_stand');
                             }
                         });
                     }
                 } else {
                     // Player is not nearby, use normal animations
                     if (orc.orcIsMoving) {
                         if (!orc.anims.isPlaying || orc.anims.currentAnim.key !== 'orc_walk') {
                             orc.play('orc_walk');
                         }
                     } else {
                         if (!orc.anims.isPlaying || orc.anims.currentAnim.key !== 'orc_stand') {
                             orc.play('orc_stand');
                         }
                     }
                 }
             }

            // Check orc collisions with screen edges and reverse direction
            const orcWidth = orc.displayWidth / 2;
            const orcHeight = orc.displayHeight / 2;
            const currentTime = this.time.now;
            const timeSinceLastEdgeHit = currentTime - orc.orcLastEdgeHitTime;

            // Only allow direction reversal if more than 50ms has passed since last edge hit
            if (timeSinceLastEdgeHit > 50) {
                if (orc.x - orcWidth <= 0) {
                    // Hit left edge, move right
                    orc.orcDirection.x = Math.abs(orc.orcDirection.x);
                    orc.orcLastEdgeHitTime = currentTime;
                } else if (orc.x + orcWidth >= 800) {
                    // Hit right edge, move left
                    orc.orcDirection.x = -Math.abs(orc.orcDirection.x);
                    orc.orcLastEdgeHitTime = currentTime;
                }

                if (orc.y - orcHeight <= 0) {
                    // Hit top edge, move down
                    orc.orcDirection.y = Math.abs(orc.orcDirection.y);
                    orc.orcLastEdgeHitTime = currentTime;
                } else if (orc.y + orcHeight >= 600) {
                    // Hit bottom edge, move up
                    orc.orcDirection.y = -Math.abs(orc.orcDirection.y);
                    orc.orcLastEdgeHitTime = currentTime;
                }
            }
         });
     }

    scheduleOrcBehaviorChange(orc) {
          // Don't change behavior if orc is swinging axe or dead
          if (!orc.orcIsAxeSwinging && !orc.orcIsDead) {
              // Toggle between moving and stationary
              orc.orcIsMoving = !orc.orcIsMoving;

              if (orc.orcIsMoving) {
                  // Pick a random direction (8 directions including diagonals)
                  const directions = [
                      { x: 0, y: -1 },  // up
                      { x: 1, y: -1 },  // up-right
                      { x: 1, y: 0 },   // right
                      { x: 1, y: 1 },   // down-right
                      { x: 0, y: 1 },   // down
                      { x: -1, y: 1 },  // down-left
                      { x: -1, y: 0 },  // left
                      { x: -1, y: -1 }  // up-left
                  ];
                  orc.orcDirection = Phaser.Utils.Array.GetRandom(directions);
              }
          }

          // Schedule next behavior change with randomized interval (2000-4000ms)
          // If orc is swinging axe, check again sooner (500ms) to see if it's done
          const behaviorInterval = orc.orcIsAxeSwinging ? 500 : Phaser.Math.Between(2000, 4000);

          // Store timer reference on orc for proper cleanup
          orc.behaviorTimer = this.time.delayedCall(behaviorInterval, () => {
              if (!orc.destroyed && !orc.orcIsDead) {
                  this.scheduleOrcBehaviorChange(orc);
              }
          });
      }

      handlePlayerOrcCollision(player, orc) {
        if (this.gameIsOver){
          return;
        }

          const orcIsToTheLeft = orc.x < player.x;
          // Only trigger if player is currently swinging sword and orc is not already dead
          if (this.isPlayerSwinging && !orc.orcIsDead) {
              // Check if orc is on the correct side based on player's facing direction
              const playerFacingLeft = player.flipX;

              // If player is facing left, only hit orcs to the left
              // If player is facing right, only hit orcs to the right
              if ((playerFacingLeft && !orcIsToTheLeft) || (!playerFacingLeft && orcIsToTheLeft)) {
                  // Orc is on the wrong side, don't hit it
                  return;
              }

               console.log('Orc not dead, triggering death sequence');
               // Mark orc as dead
               orc.orcIsDead = true;

               // Lower orc's depth so it renders under the player after death
               orc.setDepth(-1);

               // Stop orc movement
               orc.body.setVelocity(0, 0);

               // Play death animation
               orc.play('orc_die');

               // After death animation completes, start fade out
               orc.once('animationcomplete-orc_die', () => {
                   // Stop animation so the last frame stays visible
                   orc.stop();

                   // Create a tween to fade out over 2 seconds
                   orc.fadeTween = this.tweens.add({
                       targets: orc,
                       alpha: 0,
                       duration: 2000,
                       ease: 'Linear',
                       onComplete: () => {
                           // Clean up the tween reference
                           if (orc.fadeTween) {
                               orc.fadeTween = null;
                           }
                           orc.destroy();
                           // Check if all orcs are defeated
                           this.checkWinCondition();
                       }
                   });
               });
          }
        else{
          // Only cause damage if orc is not dead and not already swinging axe
          if (!orc.orcIsDead && !orc.hasRecentlyAttacked) {
              // Check if player is currently invulnerable to damage
              if (this.playerLastHitTime && this.time.now - this.playerLastHitTime < 1000) {
                  // Player is invulnerable, don't take damage
                  return;
              }

              const orcFacingLeft = orc.flipX;
              // If ork is facing left, only hit player to the left
              // If ork is facing right, only hit player to the right
              if ((orcFacingLeft && orcIsToTheLeft) || (!orcFacingLeft && !orcIsToTheLeft)) {
                  // Orc is on the wrong side, don't hit it
                  return;
              }
                  orc.hasRecentlyAttacked = true;
                  this.time.delayedCall(500, () => {
                    orc.hasRecentlyAttacked = false;
                  })

                  // Set player invulnerability timer
                  this.playerLastHitTime = this.time.now;

                  // Reduce player health
                  player.health -= 1;

                  // Update health display
                  this.healthText.setText('Health: ' + player.health);

                  // Visual feedback - flash player red and set transparency
                  player.setTint(0xff0000);
                  player.alpha = 0.7; // Make player semi-transparent

                  // Show fullscreen red effect for 10ms
                  this.hitEffect.setVisible(true);
                  this.time.delayedCall(10, () => {
                      if (this.hitEffect) {
                          this.hitEffect.setVisible(false);
                      }
                  });

                  // Gradually restore alpha over the invulnerability period
                  this.time.delayedCall(1000, () => {
                      if (player && !player.destroyed) {
                          player.alpha = 1;
                      }
                  });

                  this.time.delayedCall(200, () => {
                      if (player && !player.destroyed) {
                          player.clearTint();
                      }
                  });

                  // Check for game over
                  if (player.health <= 0) {
                      this.gameOver();
                  }
          }

        }
      }

gameOver() {
        this.gameIsOver = true;
        // Display game over text
        this.resultText = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.resultText.setOrigin(0.5);
        this.resultText.setDepth(10);

        // Create Play Again button
        this.playAgainButton = this.add.text(400, 350, 'Play Again', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#c19a6b',
            padding: {
                left: 20,
                right: 20,
                top: 10,
                bottom: 10
            }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Function to restart the game
        const restartGame = () => {
            // Remove the space key listener if it exists
            if (this.spaceKeyListener) {
                this.spaceKeyListener.removeAllListeners();
                this.spaceKeyListener.destroy();
                this.spaceKeyListener = null;
            }
            this.currentLevelIndex = 0; // Reset to first level
            this.initializeGame();
        };

        this.playAgainButton.on('pointerdown', restartGame);

        // Add keyboard listener for space key to restart the game
        this.spaceKeyListener = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKeyListener.on('down', restartGame);

        // Stop player movement
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
        }

        // Stop all orcs and destroy them
        const orcsToDestroy = [...this.orcs.children.entries]; // Create a copy to avoid iteration issues
        orcsToDestroy.forEach(orc => {
            if (!orc.destroyed) {
                // Clear any pending behavior timers
                if (orc.behaviorTimer) {
                    orc.behaviorTimer.remove(false);
                }
                // Complete any fade tweens immediately
                if (orc.fadeTween) {
                    orc.fadeTween.complete();
                    orc.fadeTween = null;
                }
                // Remove all animation listeners
                orc.off('animationcomplete-orc_die');
                orc.off('animationcomplete-orc_axe');
                // Stop any current animations
                if (orc.anims) {
                    orc.anims.stop();
                }
                // Reset alpha in case it was modified by a tween
                orc.alpha = 1;
                // Destroy the orc
                orc.destroy();
            }
        });
        // Clear the orcs group
        this.orcs.clear();
    }
}

export default MainScene;
