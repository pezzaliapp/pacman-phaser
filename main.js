// main.js

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Creazione di una texture per Pac-Man: un cerchio giallo con "mordente"
    let pacmanGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    pacmanGraphics.fillStyle(0xFFFF00, 1);
    pacmanGraphics.slice(16, 16, 16, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    pacmanGraphics.fillPath();
    pacmanGraphics.generateTexture('pacman', 32, 32);
    pacmanGraphics.destroy();

    // Creazione di una texture per il fantasma: un cerchio rosso
    let ghostGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    ghostGraphics.fillStyle(0xFF0000, 1);
    ghostGraphics.fillCircle(16, 16, 16);
    ghostGraphics.generateTexture('ghost', 32, 32);
    ghostGraphics.destroy();
  }

  create() {
    // Costanti per le dimensioni delle tile
    this.tileSize = 32;
    // Definizione del labirinto: matrice 7x9 (0 = parete, 1 = pellet, 2 = vuoto)
    this.mazeData = [
      [0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,0],
      [0,1,0,0,1,0,0,1,0],
      [0,1,1,1,1,1,1,1,0],
      [0,1,0,1,0,1,0,1,0],
      [0,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0]
    ];

    // Disegno del labirinto
    this.mazeGraphics = this.add.graphics();
    this.drawMaze();

    // Creazione di Pac-Man, posizionato nella cella [1,1]
    this.pacman = this.physics.add.sprite(
      this.tileSize * 1 + this.tileSize / 2,
      this.tileSize * 1 + this.tileSize / 2,
      'pacman'
    );
    this.pacman.speed = 100;

    // Creazione del fantasma, posizionato nella cella [7,1]
    this.ghost = this.physics.add.sprite(
      this.tileSize * 7 + this.tileSize / 2,
      this.tileSize * 1 + this.tileSize / 2,
      'ghost'
    );
    this.ghost.speed = 50;
    // Definiamo un semplice percorso per il fantasma (circuito)
    this.ghostPath = [
      { col: 7, row: 1 },
      { col: 7, row: 5 },
      { col: 1, row: 5 },
      { col: 1, row: 1 }
    ];
    this.ghostTargetIndex = 1;

    // Impostazione dei controlli da tastiera
    this.cursors = this.input.keyboard.createCursorKeys();

    // Dati di gioco: punteggio, vite e livello
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // Aggiunta dell'HUD
    this.scoreText = this.add.text(10, 10, "Score: " + this.score, { font: "16px Arial", fill: "#ffffff" });
    this.livesText = this.add.text(10, 30, "Lives: " + this.lives, { font: "16px Arial", fill: "#ffffff" });
    this.levelText = this.add.text(10, 50, "Level: " + this.level, { font: "16px Arial", fill: "#ffffff" });

    // Impostazione dei controlli touch associati ai bottoni presenti nel DOM
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

  // Funzione per disegnare il labirinto (pareti e pellet)
  drawMaze() {
    this.mazeGraphics.clear();
    for (let row = 0; row < this.mazeData.length; row++) {
      for (let col = 0; col < this.mazeData[row].length; col++) {
        let value = this.mazeData[row][col];
        let x = col * this.tileSize;
        let y = row * this.tileSize;
        if (value === 0) {
          // Disegno della parete (rettangolo blu)
          this.mazeGraphics.fillStyle(0x0000FF, 1);
          this.mazeGraphics.fillRect(x, y, this.tileSize, this.tileSize);
        } else {
          // Sfondo nero e, se presente, disegno del pellet
          this.mazeGraphics.fillStyle(0x000000, 1);
          this.mazeGraphics.fillRect(x, y, this.tileSize, this.tileSize);
          if (value === 1) {
            this.mazeGraphics.fillStyle(0xFFFFFF, 1);
            this.mazeGraphics.fillCircle(x + this.tileSize/2, y + this.tileSize/2, this.tileSize/10);
          }
        }
      }
    }
  }

  update(time, delta) {
    // Controlli da tastiera per Pac-Man
    let velocityX = 0, velocityY = 0;
    if (this.cursors.left.isDown) {
      velocityX = -this.pacman.speed;
    } else if (this.cursors.right.isDown) {
      velocityX = this.pacman.speed;
    }
    if (this.cursors.up.isDown) {
      velocityY = -this.pacman.speed;
    } else if (this.cursors.down.isDown) {
      velocityY = this.pacman.speed;
    }
    if (velocityX !== 0 || velocityY !== 0) {
      this.pacman.setVelocity(velocityX, velocityY);
    }

    // Gestione della raccolta del pellet
    let tileX = Math.floor(this.pacman.x / this.tileSize);
    let tileY = Math.floor(this.pacman.y / this.tileSize);
    if (this.mazeData[tileY] && this.mazeData[tileY][tileX] === 0) {
      this.pacman.setVelocity(0, 0);
    }
    if (this.mazeData[tileY] && this.mazeData[tileY][tileX] === 1) {
      this.mazeData[tileY][tileX] = 2;
      this.score += 10;
      this.scoreText.setText("Score: " + this.score);
      this.drawMaze();
    }

    // Movimento del fantasma lungo il percorso predefinito
    let target = this.ghostPath[this.ghostTargetIndex];
    let targetX = target.col * this.tileSize + this.tileSize / 2;
    let targetY = target.row * this.tileSize + this.tileSize / 2;
    let ghostVector = new Phaser.Math.Vector2(targetX - this.ghost.x, targetY - this.ghost.y);
    if (ghostVector.length() < 5) {
      this.ghostTargetIndex = (this.ghostTargetIndex + 1) % this.ghostPath.length;
    } else {
      ghostVector = ghostVector.normalize().scale(this.ghost.speed);
      this.ghost.setVelocity(ghostVector.x, ghostVector.y);
    }

    // Verifica della collisione tra Pac-Man e il fantasma
    let distance = Phaser.Math.Distance.Between(this.pacman.x, this.pacman.y, this.ghost.x, this.ghost.y);
    if (distance < this.pacman.width/2 + this.ghost.width/2) {
      this.lives -= 1;
      this.livesText.setText("Lives: " + this.lives);
      // Resetta le posizioni di Pac-Man e del fantasma
      this.pacman.setPosition(this.tileSize * 1 + this.tileSize/2, this.tileSize * 1 + this.tileSize/2);
      this.ghost.setPosition(this.tileSize * 7 + this.tileSize/2, this.tileSize * 1 + this.tileSize/2);
      if (this.lives <= 0) {
        // Per semplicità, si riavvia la scena in caso di Game Over
        this.scene.restart();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
      }
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 288,
  height: 224,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "gameContainer"  // Il gioco scalerà in base allo spazio di #gameContainer
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: GameScene
};

const game = new Phaser.Game(config);
