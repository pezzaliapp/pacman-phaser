const TILE_SIZE = 16;
const MAP_COLS = 21;
const MAP_ROWS = 17;

// SCENA DI START
class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add
      .text(centerX, centerY - 60, 'PAC-MAN', {
        fontSize: '48px',
        fill: '#fff'
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(centerX, centerY + 20, 'START', {
        fontSize: '32px',
        fill: '#0f0'
      })
      .setOrigin(0.5)
      .setInteractive();

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

// SCENA DI GIOCO
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Muraglia
    const wallGfx = this.make.graphics({ add: false });
    wallGfx.fillStyle(0x0000ff);
    wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGfx.destroy();

    // Pac-Man
    const pacGfx = this.make.graphics({ add: false });
    pacGfx.fillStyle(0xffff00);
    pacGfx.slice(
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      Phaser.Math.DegToRad(30),
      Phaser.Math.DegToRad(330),
      false
    );
    pacGfx.fillPath();
    pacGfx.generateTexture('pacman', TILE_SIZE, TILE_SIZE);
    pacGfx.destroy();

    // Fantasma
    const ghostGfx = this.make.graphics({ add: false });
    ghostGfx.fillStyle(0xff0000);
    ghostGfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
    ghostGfx.generateTexture('ghost', TILE_SIZE, TILE_SIZE);
    ghostGfx.destroy();

    // Pellet
    const pelletGfx = this.make.graphics({ add: false });
    pelletGfx.fillStyle(0xffffff);
    pelletGfx.fillCircle(4, 4, 4);
    pelletGfx.generateTexture('pellet', 8, 8);
    pelletGfx.destroy();
  }

  create() {
    // Mappa 21x17 (0 = muro, 1 = pellet, 2 = spazio)
    // RIGA 8 con col 0 e col 20 = 2, così c'è il corridoio wrap orizzontale
    this.mazeData = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0],
      [0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0],
      [0,1,0,1,0,1,2,2,2,1,1,2,2,2,1,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,0,2,1,1,0,0,2,1,1,0,1,0,1,0],
      [2,1,0,1,0,1,2,2,2,1,1,2,2,2,1,1,0,1,0,1,2],
      [0,1,1,1,0,1,1,1,1,1,0,0,0,1,1,1,0,1,1,1,0],
      [0,1,0,1,0,0,0,0,0,0,0,2,2,0,0,0,0,1,0,1,0],
      [0,1,0,1,0,1,1,1,1,1,1,2,2,1,1,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,2,2,2,2,2,2,2,2,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,0,0,0,0,0,0,0,2,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,2,2,2,2,2,2,2,2,1,0,1,0,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];

    // Muri e pellet
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.staticGroup();

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        if (this.mazeData[r][c] === 0) {
          this.walls.create(x, y, 'wall');
        } else if (this.mazeData[r][c] === 1) {
          this.pellets.create(x, y, 'pellet');
        }
      }
    }

    // Pac-Man
    this.pacman = this.physics.add.sprite(
      1 * TILE_SIZE + TILE_SIZE / 2,
      1 * TILE_SIZE + TILE_SIZE / 2,
      'pacman'
    );
    this.pacman.speed = 80;

    // Fantasmi
    this.ghosts = this.physics.add.group();
    const ghostStart = [
      { x: 10 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 9  * TILE_SIZE + TILE_SIZE / 2, y: 6 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 12 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 }
    ];
    ghostStart.forEach(pos => {
      const g = this.physics.add.sprite(pos.x, pos.y, 'ghost');
      g.speed = 60;
      // Assegniamo una direzione "neutra" iniziale (0,0)
      g.dir = { dx: 0, dy: 0 };
      this.ghosts.add(g);
    });

    // Collisioni con muri
    this.physics.add.collider(this.pacman, this.walls);
    this.physics.add.collider(this.ghosts, this.walls);

    // Overlap con pellet e fantasmi
    this.physics.add.overlap(this.pacman, this.pellets, this.collectPellet, null, this);
    this.physics.add.overlap(this.pacman, this.ghosts, this.hitGhost, null, this);

    // Controlli
    this.cursors = this.input.keyboard.createCursorKeys();
    this.setupTouchControls();
    this.desiredDir = { dx: 0, dy: 0 };
    this.currentDir = { dx: 0, dy: 0 };

    // Variabili di gioco
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.updateScorePanel();

    // Fantasmi: scegli direzioni iniziali
    this.ghosts.getChildren().forEach(ghost => {
      this.assignRandomDir(ghost);
    });
  }

  update() {
    this.handlePacmanMovement();
    this.ghosts.getChildren().forEach(ghost => {
      this.updateGhost(ghost);
    });
  }

  // Gestione Pac-Man: direzione desiderata, cambio direzione, wrap orizzontale
  handlePacmanMovement() {
    // Legge da tastiera
    if (this.cursors.left.isDown) {
      this.desiredDir = { dx: -1, dy: 0 };
    } else if (this.cursors.right.isDown) {
      this.desiredDir = { dx: 1, dy: 0 };
    } else if (this.cursors.up.isDown) {
      this.desiredDir = { dx: 0, dy: -1 };
    } else if (this.cursors.down.isDown) {
      this.desiredDir = { dx: 0, dy: 1 };
    }

    // Centro cella
    const col = Math.floor(this.pacman.x / TILE_SIZE);
    const row = Math.floor(this.pacman.y / TILE_SIZE);
    const centerX = col * TILE_SIZE + TILE_SIZE / 2;
    const centerY = row * TILE_SIZE + TILE_SIZE / 2;
    const threshold = 4;

    // Se siamo quasi al centro
    if (
      Math.abs(this.pacman.x - centerX) < threshold &&
      Math.abs(this.pacman.y - centerY) < threshold
    ) {
      // Verifichiamo se la direzione desiderata è libera
      if (this.isFree(col + this.desiredDir.dx, row + this.desiredDir.dy)) {
        this.pacman.setVelocity(this.desiredDir.dx * this.pacman.speed, this.desiredDir.dy * this.pacman.speed);
        this.updatePacmanAngle(this.desiredDir);
        this.currentDir = { ...this.desiredDir };
      }
    }

    // Wrap orizzontale sulle coordinate
    if (this.pacman.x < 0) {
      this.pacman.x = MAP_COLS * TILE_SIZE + this.pacman.x; // es. se x = -2, diventa 336 - 2 = 334
    } else if (this.pacman.x > MAP_COLS * TILE_SIZE) {
      this.pacman.x = this.pacman.x - (MAP_COLS * TILE_SIZE);
    }
  }

  // Aggiorna l’angolo di Pac-Man in base alla direzione
  updatePacmanAngle(dir) {
    if (dir.dx > 0) {
      this.pacman.setAngle(0);
    } else if (dir.dx < 0) {
      this.pacman.setAngle(180);
    } else if (dir.dy < 0) {
      this.pacman.setAngle(270);
    } else if (dir.dy > 0) {
      this.pacman.setAngle(90);
    }
  }

  // Logica fantasmi: se possono proseguire diritto, vanno avanti; altrimenti scelgono nuova direzione
  updateGhost(ghost) {
    // Calcola la cella in cui si trova
    let tileX = Math.floor(ghost.x / TILE_SIZE);
    let tileY = Math.floor(ghost.y / TILE_SIZE);

    // Centro cella
    const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
    const dist = Phaser.Math.Distance.Between(ghost.x, ghost.y, cx, cy);

    // Se è vicino al centro
    if (dist < 2) {
      // Verifichiamo se può proseguire con la direzione attuale
      const nextX = tileX + ghost.dir.dx;
      const nextY = tileY + ghost.dir.dy;
      if (!this.isFree(nextX, nextY)) {
        // Se non può proseguire, assegnamo direzione casuale tra quelle disponibili
        this.assignRandomDir(ghost);
      } else {
        // Altrimenti continua dritto
        ghost.setVelocity(ghost.dir.dx * ghost.speed, ghost.dir.dy * ghost.speed);
      }
    }

    // Wrap orizzontale (stessa logica di Pac-Man)
    if (ghost.x < 0) {
      ghost.x = MAP_COLS * TILE_SIZE + ghost.x;
    } else if (ghost.x > MAP_COLS * TILE_SIZE) {
      ghost.x = ghost.x - (MAP_COLS * TILE_SIZE);
    }
  }

  // Assegna al fantasma una direzione casuale tra quelle disponibili
  assignRandomDir(ghost) {
    const tileX = Math.floor(ghost.x / TILE_SIZE);
    const tileY = Math.floor(ghost.y / TILE_SIZE);
    const dirs = this.getPossibleDirs(tileX, tileY);
    if (dirs.length > 0) {
      const chosen = Phaser.Utils.Array.GetRandom(dirs);
      ghost.dir = { ...chosen };
      ghost.setVelocity(chosen.dx * ghost.speed, chosen.dy * ghost.speed);
    } else {
      // Nessuna direzione (caso rarissimo se la mappa è ben fatta), ferma fantasma
      ghost.setVelocity(0, 0);
    }
  }

  // Ritorna tutte le direzioni (dx, dy) libere intorno a (tileX, tileY)
  getPossibleDirs(tx, ty) {
    const possible = [];
    // sinistra
    if (this.isFree(tx - 1, ty)) possible.push({ dx: -1, dy: 0 });
    // destra
    if (this.isFree(tx + 1, ty)) possible.push({ dx: 1, dy: 0 });
    // su
    if (this.isFree(tx, ty - 1)) possible.push({ dx: 0, dy: -1 });
    // giù
    if (this.isFree(tx, ty + 1)) possible.push({ dx: 0, dy: 1 });
    return possible;
  }

  // isFree gestisce il wrap orizzontale a livello di "tile"
  // Se tx < 0 => wrap a destra, se tx >= MAP_COLS => wrap a sinistra
  // Per y invece controlliamo i limiti (Pac-Man di solito non ha wrap verticale).
  isFree(tx, ty) {
    // Wrap orizzontale
    if (tx < 0) {
      tx += MAP_COLS;
    } else if (tx >= MAP_COLS) {
      tx -= MAP_COLS;
    }
    // Fuori dai limiti verticali => consideriamo muro
    if (ty < 0 || ty >= MAP_ROWS) {
      return false;
    }
    // 0 = muro, => non libero
    return this.mazeData[ty][tx] !== 0;
  }

  // Pac-Man prende il pellet
  collectPellet(pac, pel) {
    pel.destroy();
    this.score += 10;
    this.updateScorePanel();
    if (this.pellets.countActive() === 0) {
      // Fine livello
      this.level++;
      this.updateScorePanel();
      this.scene.restart();
      this.registry.destroy();
      this.events.off();
    }
  }

  // Pac-Man colpisce un fantasma
  hitGhost() {
    this.lives--;
    this.updateScorePanel();
    this.resetPositions();

    if (this.lives <= 0) {
      // Game Over
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.updateScorePanel();
      this.scene.restart();
      this.registry.destroy();
      this.events.off();
    }
  }

  // Riposiziona Pac-Man e fantasmi come all’inizio
  resetPositions() {
    this.pacman.setPosition(1 * TILE_SIZE + TILE_SIZE / 2, 1 * TILE_SIZE + TILE_SIZE / 2);
    this.pacman.setVelocity(0, 0);

    const ghostStart = [
      { x: 10 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 9  * TILE_SIZE + TILE_SIZE / 2, y: 6 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 12 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 }
    ];
    let i = 0;
    this.ghosts.getChildren().forEach(ghost => {
      ghost.setPosition(ghostStart[i].x, ghostStart[i].y);
      ghost.setVelocity(0, 0);
      ghost.dir = { dx: 0, dy: 0 };
      i++;
    });
  }

  // Gestione punteggio
  updateScorePanel() {
    document.getElementById('scoreLabel').textContent = `Score: ${this.score}`;
    document.getElementById('livesLabel').textContent = `Lives: ${this.lives}`;
    document.getElementById('levelLabel').textContent = `Level: ${this.level}`;
  }

  // Controlli tattili
  setupTouchControls() {
    const setDir = (dx, dy) => {
      this.desiredDir = { dx, dy };
    };

    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    [
      [btnUp, 0, -1],
      [btnDown, 0, 1],
      [btnLeft, -1, 0],
      [btnRight, 1, 0]
    ].forEach(([btn, dx, dy]) => {
      btn.addEventListener('click', () => setDir(dx, dy));
      btn.addEventListener('touchstart', ev => {
        ev.preventDefault();
        setDir(dx, dy);
      });
    });
  }
}

// Configurazione Phaser
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: MAP_COLS * TILE_SIZE,
  height: MAP_ROWS * TILE_SIZE,
  backgroundColor: '#000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'gameContainer'
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [StartScene, GameScene]
};

new Phaser.Game(config);
