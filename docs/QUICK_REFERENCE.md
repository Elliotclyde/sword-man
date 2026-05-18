# Quick Reference: Key Findings

## File Location

- **Main Game Logic**: `/Users/hughhaworth/dev/phaser-project/scenes/MainScene.js` (5,069 lines)
- **Full Analysis**: `/Users/hughhaworth/dev/phaser-project/CODEBASE_ANALYSIS.md`

## Key Methods to Know

### Projectiles

- `spawnFireball(wizard)` - Line 3233: Creates wizard fireballs
- `handleFireballHit(player, fireball)` - Line 1493: Damage + particle effects

### Animations

- All animations created in `create()` - Line 1841
- Pattern: `this.anims.create({ key: "name", frames: [...], frameRate: 10, repeat: -1 })`
- Completion listeners: `entity.once('animationcomplete-${key}', callback)`

### Entity Lifecycle

- `spawnEnemy(type)` - Line 3148: Creates enemies
- `scheduleEnemyBehaviorChange(enemy)` - Line 4554: Behavior loop
- `initializeGame()` - Line ~895: Complete cleanup on level transitions

### Attack Patterns

- `scheduleWizardAttack(wizard)` - Line 3320: Random timed attacks (1.5-3s interval)
- `checkAndExecuteAlignedAttack(wizard)` - Line 3269: Reactive attacks based on alignment

### Particles & Effects

- `createFireballParticles(x, y)` - Line 4338: Orange burst effect
- `createBloodParticles(x, y, type)` - Line 4261: Red spray effect

## Critical Patterns

### Creating a New Projectile Type

1. **Add to entityTypes** (line ~4):

   ```javascript
   NEW_PROJECTILE: "NEW_PROJECTILE";
   ```

2. **Create spawn method**:
   - Set position offset from source
   - Create sprite with animation
   - Add physics body with collision box
   - Set velocity
   - Add to group for tracking
   - Schedule 5-second timeout

3. **Create collision handler**:
   - Check invulnerability window (1000ms)
   - Deal damage (-1 health)
   - Create particle effects
   - Play sound
   - Destroy projectile

4. **Create animation** (in create()):
   - 10 fps frame rate (standard)
   - Use repeat: -1 for looping

5. **Set up collision** (in create()):
   - Use `this.physics.add.overlap()`
   - Link to collision handler

6. **Add cleanup** (in initializeGame()):
   - Destroy all projectiles
   - Clear group
   - Cancel timers

## Important Constants

- **Fireball velocity**: 300 px/s
- **Fireball lifetime**: 5000ms timeout
- **Attack animation duration**: 1200ms (12 frames @ 10fps)
- **Fireball spawn timing**: 80% through animation (960ms)
- **Player invulnerability**: 1000ms between hits
- **Animation frame rate**: 10 fps (consistent)
- **Depth values**: Background -10, Player 5, Fireballs 2, UI 10-15
- **Wizard attack cooldown**: 500ms for aligned attacks
- **Wizard alignment tolerance**: ±50px on Y axis
- **Enemy behavior change interval**: 2000-4000ms

## Group Management

Groups used for bulk tracking and cleanup:

- `this.fireballs` - All active fireballs
- `this.enemies` - All active enemies
- `this.pendingFireballTimers` - Timers needing cleanup
- Pattern: Always iterate `group.children.entries`

## State Flags (Check Before Actions)

```javascript
enemy.isDead; // Dead entities
enemy.isAttacking; // Currently playing attack anim
enemy.isAxeSwinging; // Currently swinging weapon
enemy.isMoving; // Currently moving vs stationary
entity.destroyed; // Already cleaned up (always check!)
```

## Timing Pattern

Most delayed actions follow this pattern:

```javascript
const timer = this.time.delayedCall(milliseconds, () => {
  // Check entity still exists
  if (!entity || entity.destroyed) return;
  // Do action
});

// Track timer for cleanup
if (this.pendingFireballTimers) {
  this.pendingFireballTimers.push(timer);
}
```

## Animation Completion Events

```javascript
// Listen once (auto-removes after first fire)
entity.once("animationcomplete-animKey", () => {
  // Handle completion
});

// Check if animation is playing
if (entity.anims.isPlaying) {
  const currentKey = entity.anims.currentAnim.key;
}
```
