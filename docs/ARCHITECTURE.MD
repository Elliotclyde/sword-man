# Game Architecture & Data Flow

## Entity Type Hierarchy

```
Entity
├── Player (Soldier)
│   ├── Health: 6
│   ├── Animations: stand, walk, sword
│   └── Abilities: move, dash, attack
│
├── Enemies
│   ├── ORC
│   │   ├── Health: 1
│   │   ├── Animations: stand, walk, attack, die
│   │   ├── Attack: Touch damage + optional projectile
│   │   └── Behavior: Random movement, turn-around detection
│   │
│   ├── WIZARD
│   │   ├── Health: 1
│   │   ├── Animations: stand, walk, attack, die
│   │   ├── Attack: Fireball projectile (2 patterns)
│   │   └── Behavior: Random movement + alignment detection
│   │
│   ├── WEREWOLF
│   │   ├── Health: 1
│   │   ├── Animations: stand, walk, attack, die
│   │   ├── Attack: Touch damage
│   │   └── Behavior: Detection-based hunting
│   │
│   ├── ARMOREDORC
│   │   ├── Health: 3
│   │   ├── Animations: stand, walk, attack, die
│   │   ├── Attack: Touch damage
│   │   └── Behavior: Random movement, turn-around detection
│   │
│   └── BEHOLDER
│       ├── Health: 7
│       ├── Animations: stand, walk (4 directions), attack, die
│       ├── Attack: Touch damage
│       └── Behavior: Random movement (4 cardinal directions)
│
└── Projectiles
    └── WIZARD_FIREBALL
        ├── Source: Wizard entity
        ├── Animation: Looping fireball animation
        ├── Physics: Horizontal travel only
        ├── Lifetime: 5 seconds (timeout)
        ├── Damage: -1 health to player
        └── Cleanup: On collision or timeout

```

## Game Loop Flow

```
create() - Initialization
│
├─ Load spritesheets
├─ Create animations (all types)
├─ Create game groups
│  ├─ this.enemies
│  ├─ this.fireballs
│  ├─ this.potions
│  └─ this.pendingFireballTimers
├─ Create player
├─ Set up collisions/overlaps
└─ Initialize UI

        │
        ↓
initializeGame() - Level Setup
│
├─ Clear previous state
│  ├─ Destroy all enemies
│  ├─ Destroy all projectiles
│  ├─ Cancel all timers
│  └─ Reset UI
├─ Spawn enemies (configured count)
│  └─ Each enemy: scheduleEnemyBehaviorChange()
├─ If wizard spawned: scheduleWizardAttack()
└─ Reset player position & health

        │
        ↓
update() - Game Loop (Every Frame)
│
├─ Input handling
│  ├─ Movement (arrow keys)
│  ├─ Dash (X key)
│  └─ Attack (Space key)
├─ Update player
│  ├─ Animation state
│  ├─ Facing direction
│  └─ Position
├─ Update enemies
│  ├─ Movement (velocity)
│  ├─ Animation state
│  └─ Wizard attack check (every ~200ms)
├─ Check collisions
│  ├─ Player-Enemy collision
│  ├─ Fireball-Player overlap
│  ├─ Player-Wall collision
│  └─ Enemy-Wall collision
└─ Update particles & effects

        │
        ↓
Scheduled Actions (via time.delayedCall)
│
├─ Enemy behavior changes (2-4s interval)
├─ Wizard random attacks (1.5-3s interval)
├─ Wizard aligned attacks (on trigger)
├─ Fireball spawning (during attack)
├─ Particle tweens (0.25-0.5s duration)
└─ Timeout cleanups (5s for fireballs)

        │
        ↓
Collision Handlers
│
├─ handleFireballHit()
│  ├─ Check invulnerability
│  ├─ Apply damage
│  ├─ Particle effects
│  ├─ Sound effects
│  └─ Destroy fireball
│
├─ handlePlayerEnemyCollision()
│  ├─ Check sword swing
│  ├─ Apply damage
│  ├─ Handle death (trigger die animation)
│  └─ Spawn rewards
│
└─ handleEnemyWallCollision()
   └─ Reverse direction on edge

        │
        ↓
Death & Cleanup
│
├─ Play death animation
├─ Spawn particles
├─ Play death sound
├─ Check level complete
│  └─ If all enemies dead: spawn key
├─ On key pickup: advance to next level
│  └─ Call initializeGame() for next level
└─ On player death: gameOver()
   └─ Show game over screen
```

## Wizard Attack State Machine

```
                         ┌─────────────────┐
                         │ Wizard Spawned  │
                         └────────┬────────┘
                                  │
                                  ↓
                    ┌─────────────────────────┐
                    │ scheduleWizardAttack()  │ ← Recursive
                    │ Wait 1.5-3 seconds     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ↓                         ↓
        ┌──────────────────┐      ┌─────────────────────┐
        │ Random Attack    │      │ Aligned Attack      │
        │                  │      │ (if player aligned) │
        │ 1.5-3s interval  │      │ 500ms cooldown      │
        └─────────┬────────┘      └────────────┬────────┘
                  │                            │
                  ├────────────┬───────────────┤
                  │            │               │
                  ↓            ↓               ↓
            ┌──────────────────────────────────┐
            │  Play wizard_attack animation    │
            │  Duration: 1200ms (12 frames)    │
            │  Face direction: Locked during   │
            │  isAttacking flag = true         │
            └─────────────┬────────────────────┘
                          │
                          ├─ 960ms (80% through) →
                          │
                          ↓
                  ┌──────────────────┐
                  │ spawnFireball()  │
                  │ Set velocity     │
                  │ Add to group     │
                  │ Start timeout    │
                  └──────────┬───────┘
                             │
                             ↓
                  ┌──────────────────┐
                  │ Animation ends   │
                  │ isAttacking=false│
                  │ Unlock facing    │
                  └──────────┬───────┘
                             │
                             ↓
                  ┌──────────────────┐
                  │ Return to start  │
                  │ scheduleWizardA..│
                  │ Again (recursive)│
                  └──────────────────┘

Fireball Lifecycle:

   Created ──→ Animation loop ──→ Collision? ──→ Hit player ──→ Destroy
                   │                │
                   │                └→ 5s timeout ──→ Destroy
                   │
                   └─ Moves at 300 px/s horizontally only
```

## Collision System Architecture

```
Physics World
│
├─ Overlaps (damage-on-touch)
│  ├─ Player ↔ Fireballs
│  │  └─ handleFireballHit()
│  │
│  ├─ Player ↔ Enemies (touch damage types)
│  │  └─ Damage system depends on enemy.canDamageOnTouch
│  │
│  └─ Player ↔ Potions
│     └─ handlePotionPickup()
│
└─ Colliders (blocking movement)
   ├─ Player ↔ Walls
   │  └─ handleDoorCollision() [if door]
   │
   ├─ Enemies ↔ Walls
   │  └─ handleEnemyWallCollision() [reverse direction]
   │
   ├─ Player ↔ Peninsula walls
   │  └─ Block movement
   │
   └─ Enemies ↔ Peninsula walls
      └─ handleEnemyWallCollision() [reverse direction]

Physics Body Properties:
├─ Player: 20.4 × 19.95 (+ offset 40, 38)
├─ Fireball: 15 × 15 (+ offset 44, 44)
├─ Enemies vary by type:
│  ├─ ORC: 20.4 × 19.95 (+ offset 40, 38)
│  ├─ WIZARD: 20.4 × 19.95 (+ offset 40, 38)
│  ├─ WEREWOLF: 20.4 × 19.95 (+ offset 40, 38)
│  ├─ ARMOREDORC: 30 × 23 (+ offset 30, 36)
│  └─ BEHOLDER: 60 × 60 (+ offset 2, 2)
```

## Depth Layering

```
Depth: 15 ━━━━━━━━━━━━━━━━━━━━━━
         (Top / UI)
         ├─ Health bar border
         ├─ Text overlays
         └─ Particles

Depth: 11 ━━━━━━━━━━━━━━━━━━━━━━
         ├─ Health bar frame

Depth: 10 ━━━━━━━━━━━━━━━━━━━━━━
         ├─ Health display
         └─ Hit effect overlay

Depth: 5  ━━━━━━━━━━━━━━━━━━━━━━
         ├─ Player
         └─ Most enemies (ORC, WIZARD, WEREWOLF, BEHOLDER)

Depth: 2  ━━━━━━━━━━━━━━━━━━━━━━
         ├─ Fireballs

Depth: -1 ━━━━━━━━━━━━━━━━━━━━━━
         ├─ Dead enemies (lower after death)

Depth: -8 ━━━━━━━━━━━━━━━━━━━━━━
         ├─ Peninsula graphics

Depth: -10 ━━━━━━━━━━━━━━━━━━━━━━
         (Bottom / Background)
         └─ Background tiles
```

## Animation State Management

```
Entity Animation Lifecycle
│
├─ Looping Animations (repeat: -1)
│  ├─ stand - Running until movement/attack
│  ├─ walk - Running until stop/attack
│  └─ wizard_fireball - Running until collision/timeout
│
├─ Single-Play Animations (repeat: 0)
│  ├─ attack - Fires animationcomplete event
│  ├─ die - Fires animationcomplete event
│  └─ sword - Fires animationcomplete event
│
└─ State Transition Control
   ├─ Flags prevent conflicts
   │  ├─ isAttacking (prevents anim override)
   │  ├─ isAxeSwinging (prevents behavior change)
   │  └─ isDead (prevents all updates)
   │
   └─ Animation completion listeners
      └─ entity.once('animationcomplete-${key}', () => {})

Animation Priority Hierarchy:
1. Death animation (highest) - isDead flag set
2. Attack animation - isAttacking flag set
3. Walk animation - isMoving=true
4. Stand animation - idle state (lowest)

Frame Rate: 10 fps (all animations consistent)
```

## Group Management Pattern

```
Initialization (in create()):
│
├─ this.enemies = this.add.group()
├─ this.fireballs = this.add.group()
├─ this.potions = this.add.group()
├─ this.bones = this.add.group()
├─ this.walls = this.physics.add.staticGroup()
├─ this.peninsulaWalls = this.physics.add.staticGroup()
└─ this.pendingFireballTimers = []

Adding Members:
│
├─ this.enemies.add(enemy)
├─ this.fireballs.add(fireball)
├─ this.potions.add(potion)
└─ this.pendingFireballTimers.push(timer)

Iteration Pattern:
│
├─ this.enemies.children.entries.forEach(enemy => {
│    if (enemy && !enemy.destroyed) { ... }
│  })
│
└─ this.fireballs.children.entries.forEach(fireball => {
     if (fireball && !fireball.destroyed) { ... }
   })

Cleanup Pattern:
│
├─ For each member: entity.destroy()
├─ Clear group: group.clear()
├─ For timers: timer.remove()
├─ Empty array: array = []
└─ Recreate empty group: group = this.add.group()
```

## Health & Damage System

```
Player Health System
│
├─ Start: 6 health
├─ Damage: -1 per hit
├─ Minimum: 0 health = death
│
└─ Invulnerability
   ├─ Duration: 1000ms between hits
   ├─ Damage taken while invuln: NO
   ├─ Projectile destroyed: YES
   └─ Visual feedback:
      ├─ Tint red (0xff0000)
      ├─ Alpha 0.7 for 1000ms
      └─ Full screen flash (10ms)

Enemy Health System
│
├─ Per-type configuration:
│  ├─ ORC: 1
│  ├─ WIZARD: 1
│  ├─ WEREWOLF: 1
│  ├─ ARMOREDORC: 3
│  └─ BEHOLDER: 7
│
├─ Damage: -1 per sword hit
├─ Death condition: health <= 0
│  ├─ Set isDead = true
│  ├─ Play death animation
│  ├─ Play death sound
│  ├─ Create blood particles
│  └─ Check if all dead
│     └─ If yes: spawn key pickup
│
└─ One-hit limit per sword swing
   └─ Track enemy.lastHitTime to prevent re-damage
```

## File & Asset Structure

```
phaser-project/
│
├─ scenes/
│  └─ MainScene.js ← ALL GAME LOGIC HERE (5,069 lines)
│
├─ assets/
│  ├─ Soldier.png (100×100 sprite frames)
│  ├─ Orc.png
│  ├─ Wizard.png
│  ├─ Werewolf.png
│  ├─ ArmoredOrc.png
│  ├─ beholder.png
│  ├─ Dungeon.png (16×16 tile sprites)
│  ├─ HealthBars.png
│  ├─ darksichord.wav (background music)
│  ├─ cathedral-ir.wav (reverb impulse)
│  ├─ sounds.json (audio sprite map)
│  └─ sounds.mp3 (audio sprite data)
│
├─ config.js ← Phaser configuration
├─ game.js ← Entry point
├─ index.html ← HTML wrapper
├─ AGENTS.md ← Development guidelines
└─ CODEBASE_ANALYSIS.md ← This analysis
```

## Timeline: Wizard Fireball Attack Sequence

```
Time (ms)   Event
─────────────────────────────────────────────────────────────
0           scheduleWizardAttack() scheduled (1500-3000ms wait)
1500-3000   Delay passes
            │
            ├─ wizard.isAttacking = true
            ├─ wizard.play("wizard_attack")
            ├─ Schedule fireball spawn at +960ms
            └─ Listen for animationcomplete

960         Fireball spawn occurs
            │
            ├─ spawnFireball(wizard)
            ├─ Create sprite at offset
            ├─ Play fireball animation
            ├─ Set velocity 300px/s
            ├─ Add to fireballs group
            └─ Schedule 5000ms timeout

1200        Attack animation completes
            │
            ├─ animationcomplete-wizard_attack fires
            ├─ wizard.isAttacking = false
            └─ scheduleWizardAttack() called again

Fireball Travel:
1960        Fireball 300px from wizard
3920        Fireball 600px from wizard
...

Collision:  Fireball hits player
            │
            ├─ Check invulnerability
            ├─ Apply damage (-1 health)
            ├─ Create particles
            ├─ Play sound
            ├─ Destroy fireball
            └─ Check game over

If no collision by:
6960        5000ms timeout reached
            │
            ├─ Check if fireball still exists
            └─ Destroy fireball (off-screen cleanup)
```
