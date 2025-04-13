// main.js

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Creiamo una texture per Pac-Man (arc giallo)
    let pacmanGfx = this.make.graphics({ x: 0, y: 0, add: false });
    pacmanGfx.fillStyle(0xFFFF00, 1);
    // Disegno di un arco con “bocca aperta”
    pacmanGfx.slice(8, 8, 8, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    pacmanGfx.fillPath();
    pacmanGfx.generateTexture('pacman', 16, 16);
    pacmanGfx.destroy();

    // Texture per il fantasma (un semplice cerchio rosso)
    let ghostGfx = this.make.graphics({ x: 0, y: 0, add: false });
    ghostGfx.fillStyle(0xFF0000, 1);
    ghostGfx.fillCircle(8, 8, 8);
    ghostGfx.generateTexture('ghost', 16, 16);
    ghostGfx.destroy();
  }

  create() {
    // Impostazioni di base
    this.tileSize = 16;
    // Labirinto più grande e un po’ più articolato (21×17)
    // 0 = Parete, 1 = Pellet, 2 = Vuoto
    this.mazeData = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0],
      [0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0],
      [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];

    // Disegno del labirinto
    this.mazeGraphics = this.add.graphics();
    this.drawMaze();

    // Creiamo Pac-Man (posizioniamolo in una cella “vuota” a piacere, ad es. [1,1])
    this.pacman = this.physics.add.sprite(
      this.tileSize * 1 + this.tileSize / 2,
      this.tileSize * 1 + this.tileSize / 2,
      'pacman'
    );
    this.pacman.speed = 80;  // velocità pixel/secondo

    // Creiamo un fantasma che si muove a velocità ridotta
    this.ghost = this.physics.add.sprite(
      this.tileSize * 10 + this.tileSize / 2,
      this.tileSize * 8 + this.tileSize / 2,
      'ghost'
    );
    this.ghost.speed = 60;

    // Definiamo un percorso semplice per il fantasma (qui due punti a caso, poi puoi espandere)
    this.ghostPath = [
      { col: 10, row: 8 },
      { col: 10, row: 12 }
    ];
    this.ghostTargetIndex = 1;

    // Configuriamo i cursori per la tastiera
    this.cursors = this.input.keyboard.createCursorKeys();

    // Variabili di gioco
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // HUD base per Score, Lives, Level
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { font: "14px Arial", fill: "#ffffff" });
    this.livesText = this.add.text(10, 26, `Lives: ${this.lives}`, { font: "14px Arial", fill: "#ffffff" });
    this.levelText = this.add.text(10, 42, `Level: ${this.level}`, { font: "14px Arial", fill: "#ffffff" });

    // Controlli tattili (bottoni HTML)
    document.getElementById('btn-up').addEventListener('click', () => {
      this.pacman.setVelocity(0, -this.pacman.speed);
    });
    document.getElementById('btn-down').addEventListener('click', () => {
      this.pacman.setVelocity(0, this.pacman.speed);
    });
    document.getElementById('btn-left').addEventListener('click', () => {
      this.pacman.setVelocity(-this.pacman.speed, 0);
    });
    document.getElementById('btn-right').addEventListener('click', () => {
      this.pacman.setVelocity(this.pacman.speed, 0);
    });
  }

  drawMaze() {
    this.mazeGraphics.clear();
    for (let row = 0; row < this.mazeData.length; row++) {
      for (let col = 0; col < this.mazeData[row].length; col++) {
        let cellValue = this.mazeData[row][col];
        let x = col * this.tileSize;
        let y = row * this.tileSize;

        if (cellValue === 0) {
          // Parete (rettangolo blu)
          this.mazeGraphics.fillStyle(0x0000ff, 1);
          this.mazeGraphics.fillRect(x, y, this.tileSize, this.tileSize);
        } else {
          // Sfondo nero
          this.mazeGraphics.fillStyle(0x000000, 1);
          this.mazeGraphics.fillRect(x, y, this.tileSize, this.tileSize);

          if (cellValue === 1) {
            // Pellet
            this.mazeGraphics.fillStyle(0xffffff, 1);
            this.mazeGraphics.fillCircle(x + this.tileSize / 2, y + this.tileSize / 2, this.tileSize / 6);
          }
        }
      }
    }
  }

  update() {
    // Controlli da tastiera per Pac-Man (priorità rispetto ai pulsanti tattili)
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown) {
      vx = -this.pacman.speed;
    } else if (this.cursors.right.isDown) {
      vx = this.pacman.speed;
    }
    if (this.cursors.up.isDown) {
      vy = -this.pacman.speed;
    } else if (this.cursors.down.isDown) {
      vy = this.pacman.speed;
    }
    if (vx !== 0 || vy !== 0) {
      this.pacman.setVelocity(vx, vy);
    }

    // Gestione raccolta pellet
    let tileX = Math.floor(this.pacman.x / this.tileSize);
    let tileY = Math.floor(this.pacman.y / this.tileSize);
    if (this.mazeData[tileY] && this.mazeData[tileY][tileX] === 1) {
      this.mazeData[tileY][tileX] = 2; // Diventa vuoto
      this.score += 10;
      this.scoreText.setText(`Score: ${this.score}`);
      this.drawMaze();
    }
    // Se Pac-Man entra in una parete, blocchiamo il movimento
    if (this.mazeData[tileY] && this.mazeData[tileY][tileX] === 0) {
      this.pacman.setVelocity(0, 0);
    }

    // Movimento del fantasma sul percorso
    let target = this.ghostPath[this.ghostTargetIndex];
    let targetX = target.col * this.tileSize + this.tileSize / 2;
    let targetY = target.row * this.tileSize + this.tileSize / 2;
    let dx = targetX - this.ghost.x;
    let dy = targetY - this.ghost.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 4) {
      // Passa al prossimo punto
      this.ghostTargetIndex = (this.ghostTargetIndex + 1) % this.ghostPath.length;
    } else {
      // Muove linearmente verso la destinazione
      let angle = Math.atan2(dy, dx);
      this.ghost.setVelocity(Math.cos(angle) * this.ghost.speed, Math.sin(angle) * this.ghost.speed);
    }

    // Collisione fantasma-Pac-Man
    let ghostDist = Phaser.Math.Distance.Between(this.pacman.x, this.pacman.y, this.ghost.x, this.ghost.y);
    if (ghostDist < 14) {
      // Pac-Man perde una vita
      this.lives -= 1;
      this.livesText.setText(`Lives: ${this.lives}`);
      // Reset posizioni
      this.resetPositions();

      if (this.lives <= 0) {
        // Game over: per semplicità, restart scena
        this.scene.restart();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
      }
    }
  }

  resetPositions() {
    // Riporta Pac-Man
    this.pacman.setPosition(this.tileSize * 1 + this.tileSize / 2, this.tileSize * 1 + this.tileSize / 2);
    this.pacman.setVelocity(0, 0);
    // Riporta il fantasma
    this.ghost.setPosition(this.tileSize * 10 + this.tileSize / 2, this.tileSize * 8 + this.tileSize / 2);
    this.ghostTargetIndex = 1;
  }
}

// Config Phaser con Scale Mode FIT
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 336,    // Larghezza base (21 tile * 16px)
  height: 272,   // Altezza base (17 tile * 16px)
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "gameContainer"
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: GameScene
};

const game = new Phaser.Game(config);
