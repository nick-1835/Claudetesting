# Pixel Arcade

A small web app that hosts simple browser games. Plain HTML, CSS and JavaScript (ES modules), no build step and no dependencies.

## Games

| Game | Controls |
| --- | --- |
| 🐍 Snake | Arrow keys / WASD or swipe, Space to pause |
| 🏓 Pong (vs CPU, first to 7) | W/S or ↑/↓, or drag on the court |
| 🧱 Brick Breaker | ←/→, A/D, mouse or touch; Space to launch |
| 🃏 Memory Match | Click / tap cards |
| ❌ Tic-Tac-Toe (Easy CPU, Hard CPU, 2 players) | Click / tap squares |

Best scores are saved per browser in `localStorage`.

## Run locally

```bash
npm start            # or: node server.js
# open http://localhost:3000
```

Set `PORT` to use a different port. Because everything in `public/` is static, you can also host that folder on any static host (GitHub Pages, Netlify, S3, nginx, ...).

## Project layout

```
server.js              zero-dependency static file server
public/
  index.html           page shell
  css/style.css        styles
  js/app.js            lobby + hash router (#/play/<game-id>)
  js/engine.js         shared helpers: canvas, game loop, input
  js/scores.js         high score storage
  js/games/*.js        one module per game
```

## Adding a game

Create `public/js/games/<name>.js` exporting an object like this, then add it to the `GAMES` list in `public/js/app.js`:

```js
export default {
  id: 'mygame',
  title: 'My Game',
  icon: '🎮',
  description: 'Shown on the lobby card.',
  help: 'Controls text shown under the game (HTML allowed).',
  scoreLabel: 'score',      // optional
  lowerIsBetter: false,     // optional, e.g. true for "fewest moves"
  mount(root, api) {
    // Build the game inside `root`. Use:
    //   api.setStat(name, value)   show a live stat in the header
    //   api.submitScore(n)         save a score, returns true on a new best
    //   api.showOverlay({ title, text, button, onClick })
    //   api.hideOverlay()
    return () => { /* cleanup: stop loops, remove listeners */ };
  },
};
```
