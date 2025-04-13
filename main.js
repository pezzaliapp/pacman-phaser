// main.js

const TILE_SIZE = 16;  // Dimensione di ogni tile in pixel

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Creiamo la texture per il muro (parete): un rettangolo blu
    let wallGfx = this.make.graphics({ add: false });
    wallGfx.fillStyle(0x0000ff, 1);
    wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGfx.destroy();

    // Creiamo la texture per Pac-Man: un arco giallo (dimensione 16x16)
    let pacmanGfx = this.make.graphics({ add: false });
    pacmanGfx.fillStyle(0xFFFF00, 1);
    // Disegno di un arco con "bocca aperta"
    pacmanGfx.slice(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    pacmanGfx.fillPath();
    pacmanGfx.generateTexture('pacman', TILE_SIZE, TILE_SIZE);
    pacmanGfx.destroy();

    // Creiamo la texture per il fantasma: un cerchio rosso
    let ghostGfx = this.make.graphics({ add: false });
    ghostGfx.fillStyle(0xFF0000, 1);
    ghostGfx.fillCircle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
    ghostGfx.generateTexture('ghost', TILE_SIZE, TILE_SIZE);
    ghostGfx.destroy();

    // Creiamo la texture per il pellet: un piccolo cerchio bianco
    let pelletGfx = this.make.graphics({ add: false });
    pelletGfx.fillStyle(0xFFFFFF, 1);
    let pelletSize = TILE_SIZE / 4;
    pelletGfx.fillCircle(pelletSize, pelletSize, pelletSize);
    pelletGfx.generateTexture('pellet', pelletSize * 2, pelletSize * 2);
    pelletGfx.destroy();
  }

  create() {
    this.tileSize = TILE_SIZE;

    // Definizione del labirinto (21 colonne × 17 righe)
    // 0 = Parete, 1 = Pellet, 2 = Spazio vuoto
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

    // Crea gruppi statici per le pareti e i pellet
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.staticGroup();

    for (let row = 0; row < this.mazeData.length; row++) {
      for (let col = 0; col < this.mazeData[row].length; col++) {
        let x = col * this.tileSize + this.tileSize / 2;
        let y = row * this.tileSize + this.tileSize / 2;
        let val = this.mazeData[row][col];
        if (val === 0) {
          // Crea una parete
          this.walls.create(x, y, 'wall');
        } else if (val === 1) {
          // Crea un pellet
          this.pellets.create(x, y, 'pellet');
        }
        // Se il valore è 2, è spazio vuoto – non fare nulla.
      }
    }

    // Crea Pac-Man in una posizione libera (es. cella [1,1])
    this.pacman = this.physics.add.sprite(
      this.tileSize * 1 + this.tileSize / 2,
      this.tileSize * 1 + this.tileSize / 2,
      'pacman'
    );
    this.pacman.speed = 80;
    this.pacman.setCollideWorldBounds(true);

    // Crea un gruppo per i fantasmi e aggiungi più fantasmi in posizioni differenti
    this.ghosts = this.physics.add.group();
    let ghostPositions = [
      { x: this.tileSize * 10 + this.tileSize / 2, y: this.tileSize * 8 + this.tileSize / 2 },
      { x: this.tileSize * 10 + this.tileSize / 2, y: this.tileSize * 6 + this.tileSize / 2 },
      { x: this.tileSize * 12 + this.tileSize / 2, y: this.tileSize * 8 + this.tileSize / 2 }
    ];
    ghostPositions.forEach(pos => {
      let ghost = this.physics.add.sprite(pos.x, pos.y, 'ghost');
      ghost.speed = 60;
      // Abilita il world bounds (facoltativo)
      ghost.setCollideWorldBounds(true);
      this.ghosts.add(ghost);
    });

    // Aggiungi collisioni: Pac-Man e fantasmi contro le pareti
    this.physics.add.collider(this.pacman, this.walls);
    this.physics.add.collider(this.ghosts, this.walls);

    // Imposta il rilevamento overlap per la raccolta dei pellet
    this.physics.add.overlap(this.pacman, this.pellets, this.collectPellet, null, this);

    // Imposta overlap fra Pac-Man e fantasmi
    this.physics.add.overlap(this.pacman, this.ghosts, this.hitGhost, null, this);

    // Configura i controlli da tastiera
    this.cursors = this.input.keyboard.createCursorKeys();

    // Variabili di gioco per punteggio, vite e livello
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // HUD
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { font: "14px Arial", fill: "#ffffff" });
    this.livesText = this.add.text(10, 26, `Lives: ${this.lives}`, { font: "14px Arial", fill: "#ffffff" });
    this.levelText = this.add.text(10, 42, `Level: ${this.level}`, { font: "14px Arial", fill: "#ffffff" });

    // Associa i pulsanti touch del DOM per controlli mobile
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

  update() {
    // Gestione dei controlli da tastiera per Pac-Man
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown) {
      vx = -this.pacman.speed;
      vy = 0;
    } else if (this.cursors.right.isDown) {
      vx = this.pacman.speed;
      vy = 0;
    } else if (this.cursors.up.isDown) {
      vy = -this.pacman.speed;
      vx = 0;
    } else if (this.cursors.down.isDown) {
      vy = this.pacman.speed;
      vx = 0;
    }
    if (vx !== 0 || vy !== 0) {
      this.pacman.setVelocity(vx, vy);
    }

    // Aggiorna il movimento di ogni fantasma
    this.ghosts.getChildren().forEach(ghost => {
      this.updateGhost(ghost);
    });
  }

  // Funzione di aggiornamento per i fantasmi: a ogni incrocio, sceglie una nuova direzione casuale
  updateGhost(ghost) {
    let tileX = Math.floor(ghost.x / this.tileSize);
    let tileY = Math.floor(ghost.y / this.tileSize);
    let centerX = tileX * this.tileSize + this.tileSize / 2;
    let centerY = tileY * this.tileSize + this.tileSize / 2;
    let distanceToCenter = Phaser.Math.Distance.Between(ghost.x, ghost.y, centerX, centerY);
    if (distanceToCenter < 2) {
      // Ottieni le direzioni disponibili (non bloccate da un muro)
      let dirs = this.getAvailableDirections(tileX, tileY);
      // Escludi la direzione opposta a quella corrente (per evitare inversioni improvvise)
      let currDir = { dx: Math.sign(ghost.body.velocity.x), dy: Math.sign(ghost.body.velocity.y) };
      dirs = dirs.filter(d => !(d.dx === -currDir.dx && d.dy === -currDir.dy));
      if (dirs.length === 0) dirs = this.getAvailableDirections(tileX, tileY);
      let choice = Phaser.Utils.Array.GetRandom(dirs);
      ghost.setVelocity(choice.dx * ghost.speed, choice.dy * ghost.speed);
    }
  }

  // Restituisce un array di direzioni possibili per un dato tile, in base ai dati del labirinto
  getAvailableDirections(tileX, tileY) {
    let directions = [];
    if (this.isTileFree(tileX - 1, tileY)) directions.push({ dx: -1, dy: 0 });
    if (this.isTileFree(tileX + 1, tileY)) directions.push({ dx: 1, dy: 0 });
    if (this.isTileFree(tileX, tileY - 1)) directions.push({ dx: 0, dy: -1 });
    if (this.isTileFree(tileX, tileY + 1)) directions.push({ dx: 0, dy: 1 });
    return directions;
  }

  // Verifica se una determinata cella (tile) non è un muro (0)
  isTileFree(tileX, tileY) {
    if (tileX < 0 || tileX >= this.mazeData[0].length || tileY < 0 || tileY >= this.mazeData.length)
      return false;
    return this.mazeData[tileY][tileX] !== 0;
  }

  // Funzione chiamata quando Pac-Man raccoglie un pellet
  collectPellet(pacman, pellet) {
    pellet.destroy();
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);
    // Se tutti i pellet sono raccolti, puoi passare al livello successivo (qui semplicemente si resetta la scena)
    if (this.pellets.countActive() === 0) {
      this.scene.restart();
      // (Qui potresti incrementare la difficoltà o il livello)
    }
  }

  // Funzione chiamata in caso di collisione tra Pac-Man e un fantasma
  hitGhost(pacman, ghost) {
    this.lives -= 1;
    this.livesText.setText(`Lives: ${this.lives}`);
    this.resetPositions();
    if (this.lives <= 0) {
      // Game Over: per semplicità si riavvia la scena
      this.scene.restart();
      this.score = 0;
      this.lives = 3;
    }
  }

  // Resetta le posizioni di Pac-Man e dei fantasmi dopo una collisione
  resetPositions() {
    // Riposiziona Pac-Man (es. in [1,1])
    this.pacman.setPosition(this.tileSize * 1 + this.tileSize / 2, this.tileSize * 1 + this.tileSize / 2);
    this.pacman.setVelocity(0, 0);
    // Riposiziona ogni fantasma con posizioni predefinite
    let ghostPositions = [
      { x: this.tileSize * 10 + this.tileSize / 2, y: this.tileSize * 8 + this.tileSize / 2 },
      { x: this.tileSize * 10 + this.tileSize / 2, y: this.tileSize * 6 + this.tileSize / 2 },
      { x: this.tileSize * 12 + this.tileSize / 2, y: this.tileSize * 8 + this.tileSize / 2 }
    ];
    let i = 0;
    this.ghosts.getChildren().forEach(ghost => {
      ghost.setPosition(ghostPositions[i].x, ghostPositions[i].y);
      ghost.setVelocity(0, 0);
      i++;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 336,     // 21 tile * 16 px
  height: 272,    // 17 tile * 16 px
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
