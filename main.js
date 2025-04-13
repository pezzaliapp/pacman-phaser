// main.js

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Creiamo una texture per Pac-Man: un cerchio giallo con "mordente"
    let pacmanGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    pacmanGraphics.fillStyle(0xFFFF00, 1);
    // Disegniamo un arco per simulare la bocca aperta
    pacmanGraphics.slice(16, 16, 16, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    pacmanGraphics.fillPath();
    pacmanGraphics.generateTexture('pacman', 32, 32);
    pacmanGraphics.destroy();

    // Creiamo la texture per il fantasma: un cerchio rosso
    let ghostGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    ghostGraphics.fillStyle(0xFF0000, 1);
    ghostGraphics.fillCircle(16, 16, 16);
    ghostGraphics.generateTexture('ghost', 32, 32);
    ghostGraphics.destroy();
  }

  create() {
    // Costanti di gioco
    this.tileSize = 32;
    // Definiamo il labirinto: una matrice 7x9 (0 = parete, 1 = pellet, 2 = vuoto)
    this.mazeData = [
      [0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,0],
      [0,1,0,0,1,0,0,1,0],
      [0,1,1,1,1,1,1,1,0],
      [0,1,0,1,0,1,0,1,0],
      [0,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0]
    ];

    // Creiamo un Graphics per disegnare il labirinto
    this.mazeGraphics = this.add.graphics();
    this.drawMaze();

    // Creazione di Pac-Man e posizionamento iniziale (nella cella [1,1])
    this.pacman = this.physics.add.sprite(this.tileSize * 1 + this.tileSize / 2, this.tileSize * 1 + this.tileSize / 2, 'pacman');
    this.pacman.speed = 100; // velocità in pixel al secondo

    // Creazione del fantasma, posizionato nella cella [7,1]
    this.ghost = this.physics.add.sprite(this.tileSize * 7 + this.tileSize / 2, this.tileSize * 1 + this.tileSize / 2, 'ghost');
    this.ghost.speed = 50;
    // Definiamo un percorso semplice per il fantasma (da [7,1] a [7,5] a [1,5] e [1,1])
    this.ghostPath = [
      { col: 7, row: 1 },
      { col: 7, row: 5 },
      { col: 1, row: 5 },
      { col: 1, row: 1 }
    ];
    this.ghostTargetIndex = 1;

    // Setup dei controlli da tastiera
    this.cursors = this.input.keyboard.createCursorKeys();

    // Inizializziamo i dati di gioco
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // Aggiungiamo un semplice HUD per punteggio, vite e livello
    this.scoreText = this.add.text(10, 10, "Score: " + this.score, { font: "16px Arial", fill: "#ffffff" });
    this.livesText = this.add.text(10, 30, "Lives: " + this.lives, { font: "16px Arial", fill: "#ffffff" });
    this.levelText = this.add.text(10, 50, "Level: " + this.level, { font: "16px Arial", fill: "#ffffff" });

    // Configuriamo i controlli touch: associamo i bottoni on-screen agli eventi per muovere Pac-Man
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
    // Per ogni cella della matrice, disegniamo pareti e pellet
    for (let row = 0; row < this.mazeData.length; row++) {
      for (let col = 0; col < this.mazeData[row].length; col++) {
        let value = this.mazeData[row][col];
        let x = col * this.tileSize;
        let y = row * this.tileSize;
        if (value === 0) {
          // Parete: disegniamo un rettangolo blu
          this.mazeGraphics.fillStyle(0x0000FF, 1);
          this.mazeGraphics.fillRect(x, y, this.tileSize, this.tileSize);
        } else {
          // Sfondo nero
          this.mazeGraphics.fillStyle(0x000000, 1);
          this.mazeGraphics.fillRect(x, y, this.tileSize, this.tileSize);
          if (value === 1) {
            // Pellet: un piccolo cerchio bianco al centro
            this.mazeGraphics.fillStyle(0xFFFFFF, 1);
            this.mazeGraphics.fillCircle(x + this.tileSize / 2, y + this.tileSize / 2, this.tileSize / 10);
          }
        }
      }
    }
  }

  update(time, delta) {
    // Gestione dei controlli tastiera per Pac-Man.
    // Se non vengono premuti i bottoni touch, usiamo i cursori.
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
    // Applichiamo la velocità impostata ai controlli tastiera
    if (velocityX !== 0 || velocityY !== 0) {
      this.pacman.setVelocity(velocityX, velocityY);
    }

    // Determiniamo la cella corrente in cui si trova Pac-Man
    let tileX = Math.floor(this.pacman.x / this.tileSize);
    let tileY = Math.floor(this.pacman.y / this.tileSize);

    // Se il valore della cella è 0 (parete) allora blocchiamo il movimento
    if (this.mazeData[tileY] && this.mazeData[tileY][tileX] === 0) {
      this.pacman.setVelocity(0, 0);
    }
    // Se c'è un pellet (valore 1) in quella cella, lo "raccogliamo"
    if (this.mazeData[tileY] && this.mazeData[tileY][tileX] === 1) {
      this.mazeData[tileY][tileX] = 2;  // 2 indica lo spazio vuoto dopo la raccolta
      this.score += 10;
      this.scoreText.setText("Score: " + this.score);
      this.drawMaze();
    }

    // Movimento del fantasma lungo il percorso definito
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

    // Verifica la collisione tra Pac-Man e il fantasma
    let distance = Phaser.Math.Distance.Between(this.pacman.x, this.pacman.y, this.ghost.x, this.ghost.y);
    if (distance < this.pacman.width / 2 + this.ghost.width / 2) {
      // Collisione: decrementa le vite e resetta le posizioni
      this.lives -= 1;
      this.livesText.setText("Lives: " + this.lives);
      this.pacman.setPosition(this.tileSize * 1 + this.tileSize / 2, this.tileSize * 1 + this.tileSize / 2);
      this.ghost.setPosition(this.tileSize * 7 + this.tileSize / 2, this.tileSize * 1 + this.tileSize / 2);
      if (this.lives <= 0) {
        // Game Over: per semplicità, si resetta la scena
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
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: GameScene
};

const game = new Phaser.Game(config);
