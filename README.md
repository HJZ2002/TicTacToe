🎮 Gameplay & Logic

🧩 Replaced round randomization with a player-choice prompt (X or O) every new round — including after Restart.

🔺 X always starts; if the player chooses O, the AI opens first.

🌟 Added dynamic win-line highlight (3 cells flash and glow).

🛡️ Improved input handling — no duplicate clicks or moves during AI’s turn.

🖥️ UI / UX Enhancements 

🎨 Automatically injects a “Color-Blind Mode” button beside Restart

🌀 Respects reduced-motion preferences (disables animations if system requests less motion).

🌈 Color-Blind Support & Theming

👁️‍🗨️ Implemented five high-contrast palettes

🎯 Default – Red / Cyan

🍊 Deuteranopia – Orange / Deep Blue

🧱 Protanopia – Brick / Teal

💜 Tritanopia – Magenta / Green

⚫ Monochrome – Light Gray / Dark Gray

🪄 Cycles through palettes with the Color-Blind Mode button and remembers your last selection via localStorage.

🎨 Kept the original Change Color buttons active — they randomize UI accents without overwriting X/O colors.

🏆 Score & Leaderboard

📊 All existing scoring and fastest-time logic remain intact.

🧹 Added a 50-entry cap to the leaderboard for performance and storage safety.

💡Extra Chnges

✅ Smoother round flow (choose X / O each time).

🌟 Clearer visual feedback when someone wins.

⌨️ Playable entirely by keyboard + screen-reader friendly.

🎨 Color accessibility that persists across sessions.
