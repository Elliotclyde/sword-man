// Test script to understand Phaser audio sprite format

// Howler.js format is typically [start_ms, duration_ms]
// But Phaser might interpret it differently

// Let's check what format the JSON is in by looking at the pattern
const json = {
  sprite: {
    playerhurt: [3500, 874],
    playerdead: [13374, 2000],
  },
};

// If these are [start, duration]:
// playerhurt: 3500ms to 4374ms (duration 874ms)
// playerdead: 13374ms to 15374ms (duration 2000ms)

// If these are [start, end]:
// playerhurt: 3500ms to 874ms (INVALID - end before start)
// playerdead: 13374ms to 2000ms (INVALID - end before start)

// So the format is definitely [start, duration]
// But Phaser might be expecting something different

console.log("Format analysis:");
console.log("playerhurt: start=3500ms, duration=874ms");
console.log("playerdead: start=13374ms, duration=2000ms");
console.log("");
console.log(
  "The JSON format appears correct for Howler.js format [start, duration]",
);
