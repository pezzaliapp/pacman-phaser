const TILE_SIZE = 16; // dimensione in pixel di ogni cella
const MAP_COLS = 21; // numero di colonne
const MAP_ROWS = 17; // numero di righe

class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add
      .text(centerX, centerY - 60, 'PAC-MAN', { fontSize: '48px', fill: '#fff' })
      .setOrigin(0.5);

    const startButton = this.add
      .text(centerX, centerY + 20, 'START', { fontSize: '32px', fill: '#0f0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Muro
    const wallGfx = this.make.graphics({ add: false });
    wallGfx.fillStyle(0x0000ff, 1);
    wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGfx.destroy();

    // Pac-Man
    const pacmanGfx = this.make.graphics({ add: false });
    pacmanGfx.fillStyle(0xffff00, 1);
    pacmanGfx.slice(
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      TILE_SIZE / 2,
      Phaser.Math.DegToRad(30),
      Phaser.Math.DegToRad(330),
      false
    );
    pacmanGfx.fillPath();
    pacmanGfx.generateTexture('pacman', TILE_SIZE, TILE_SIZE);
    pacmanGfx.destroy();

    // Fantasma
    const ghostGfx = this.make.graphics({ add: false });
    ghostGfx.fillStyle(0xff0000, 1);
    ghostGfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
    ghostGfx.generateTexture('ghost', TILE_SIZE, TILE_SIZE);
    ghostGfx.destroy();

    // Pellet
    const pelletGfx = this.make.graphics({ add: false });
    pelletGfx.fillStyle(0xffffff, 1);
    pelletGfx.fillCircle(4, 4, 4);
    pelletGfx.generateTexture('pellet', 8, 8);
    pelletGfx.destroy();
  }

  create() {
    // Mappa 21×17: 0 = muro, 1 = pellet, 2 = spazio vuoto
    // Abbiamo lasciato i canali laterali aperti in row 8 (al centro)
    // con “2” in colonna 0 e colonna 20, così Pac-Man e i fantasmi possono attraversare (wrap-around).
    this.mazeData = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0],
      [0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0],
      [0,1,0,1,0,1,2,2,2,1,1,2,2,2,1,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,0,2,1,1,0,0,2,1,1,0,1,0,1,0],
      // ROW 8 APERTA A SX E DX (2 in col.0 e col.20)
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

    // Gruppi statici per muri e pellet
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.staticGroup();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        if (this.mazeData[row][col] === 0) {
          this.walls.create(x, y, 'wall');
        } else if (this.mazeData[row][col] === 1) {
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
    // Disabilitiamo le collisioni con i confini del mondo (così possiamo fare wrap manuale)
    this.pacman.setCollideWorldBounds(false);

    // Fantasmi
    this.ghosts = this.physics.add.group();
    const ghostPositions = [
      { x: 10 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 9  * TILE_SIZE + TILE_SIZE / 2, y: 6 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 12 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 }
    ];

    ghostPositions.forEach(pos => {
      const ghost = this.physics.add.sprite(pos.x, pos.y, 'ghost');
      ghost.speed = 60;
      // Stessa cosa: disabilito collisioni con i confini
      ghost.setCollideWorldBounds(false);
      this.ghosts.add(ghost);
    });

    // Collisioni con i muri (Pac-Man e fantasmi)
    this.physics.add.collider(this.pacman, this.walls);
    this.physics.add.collider(this.ghosts, this.walls);

    // Overlap pellet e fantasmi
    this.physics.add.overlap(this.pacman, this.pellets, this.collectPellet, null, this);
    this.physics.add.overlap(this.pacman, this.ghosts, this.hitGhost, null, this);

    // Controlli da tastiera
    this.cursors = this.input.keyboard.createCursorKeys();

    // Variabili di gioco
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.updateScorePanel();

    // Direzioni Pac-Man
    this.desiredDir = { dx: 0, dy: 0 };
    this.currentDir = { dx: 0, dy: 0 };

    // Attiva controlli tattili
    this.setupTouchControls();

    // Avvio iniziale dei fantasmi: sceglie una direzione casuale dove possibile
    this.ghosts.getChildren().forEach(ghost => {
      const tileX = Math.floor(ghost.x / TILE_SIZE);
      const tileY = Math.floor(ghost.y / TILE_SIZE);
      let dirs = this.getAvailableDirections(tileX, tileY);
      if (dirs.length) {
        const chosen = Phaser.Utils.Array.GetRandom(dirs);
        ghost.setVelocity(chosen.dx * ghost.speed, chosen.dy * ghost.speed);
      }
    });
  }

  update() {
    //
    // 1. Legge input tastiera e aggiorna direzione desiderata
    //
    if (this.cursors.left.isDown) {
      this.desiredDir = { dx: -1, dy: 0 };
    } else if (this.cursors.right.isDown) {
      this.desiredDir = { dx: 1, dy: 0 };
    } else if (this.cursors.up.isDown) {
      this.desiredDir = { dx: 0, dy: -1 };
    } else if (this.cursors.down.isDown) {
      this.desiredDir = { dx: 0, dy: 1 };
    }

    //
    // 2. Se Pac-Man è al centro della cella, prova a cambiare direzione
    //
    const col = Math.floor(this.pacman.x / TILE_SIZE);
    const row = Math.floor(this.pacman.y / TILE_SIZE);
    const centerX = col * TILE_SIZE + TILE_SIZE / 2;
    const centerY = row * TILE_SIZE + TILE_SIZE / 2;
    const threshold = 4;

    if (
      Math.abs(this.pacman.x - centerX) < threshold &&
      Math.abs(this.pacman.y - centerY) < threshold
    ) {
      if (this.isFree(col + this.desiredDir.dx, row + this.desiredDir.dy)) {
        this.pacman.setVelocity(
          this.desiredDir.dx * this.pacman.speed,
          this.desiredDir.dy * this.pacman.speed
        );
        this.updatePacmanAngle(this.desiredDir.dx, this.desiredDir.dy);
        this.currentDir = { ...this.desiredDir };
      }
    }

    //
    // 3. Wrapping orizzontale (canali laterali)
    //
    const maxX = MAP_COLS * TILE_SIZE; // 336 px
    if (this.pacman.x < 0) {
      this.pacman.x = maxX;
    } else if (this.pacman.x > maxX) {
      this.pacman.x = 0;
    }

    // (Se vuoi anche wrap verticale, fallo qui. Di solito Pac-Man non ce l’ha.)

    //
    // 4. Aggiorna i fantasmi
    //
    this.ghosts.getChildren().forEach(ghost => {
      this.updateGhost(ghost);

      // Wrapping orizzontale anche per i fantasmi
      if (ghost.x < 0) {
        ghost.x = maxX;
      } else if (ghost.x > maxX) {
        ghost.x = 0;
      }
    });
  }

  // Aggiorna angolo sprite Pac-Man in base a dx,dy
  updatePacmanAngle(dx, dy) {
    if (dx > 0) this.pacman.setAngle(0);
    else if (dx < 0) this.pacman.setAngle(180);
    else if (dy < 0) this.pacman.setAngle(270);
    else if (dy > 0) this.pacman.setAngle(90);
  }

  // Controlli tattili
  setupTouchControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    const setDirection = (dx, dy) => {
      this.desiredDir = { dx, dy };
    };

    [
      [btnUp, 0, -1],
      [btnDown, 0, 1],
      [btnLeft, -1, 0],
      [btnRight, 1, 0]
    ].forEach(([btn, dx, dy]) => {
      btn.addEventListener('click', () => setDirection(dx, dy));
      btn.addEventListener('touchstart', ev => {
        ev.preventDefault();
        setDirection(dx, dy);
      });
    });
  }

  collectPellet(pacman, pellet) {
    pellet.destroy();
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

  hitGhost(pacman, ghost) {
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

  resetPositions() {
    // Pac-Man di nuovo a [1,1]
    this.pacman.setPosition(
      1 * TILE_SIZE + TILE_SIZE / 2,
      1 * TILE_SIZE + TILE_SIZE / 2
    );
    this.pacman.setVelocity(0, 0);

    // Fantasmi
    const ghostStarts = [
      { x: 10 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 9  * TILE_SIZE + TILE_SIZE / 2, y: 6 * TILE_SIZE + TILE_SIZE / 2 },
      { x: 12 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 }
    ];
    let i = 0;
    this.ghosts.getChildren().forEach(ghost => {
      ghost.setPosition(ghostStarts[i].x, ghostStarts[i].y);
      ghost.setVelocity(0, 0);
      i++;
    });
  }

  updateScorePanel() {
    document.getElementById('scoreLabel').textContent = `Score: ${this.score}`;
    document.getElementById('livesLabel').textContent = `Lives: ${this.lives}`;
    document.getElementById('levelLabel').textContent = `Level: ${this.level}`;
  }

  // Aggiorna il movimento di un fantasma
  updateGhost(ghost) {
    const tileX = Math.floor(ghost.x / TILE_SIZE);
    const tileY = Math.floor(ghost.y / TILE_SIZE);

    // Centri tile
    const centerX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const dist = Phaser.Math.Distance.Between(ghost.x, ghost.y, centerX, centerY);

    // Se il fantasma è vicino al centro della cella
    if (dist < 2) {
      // Direzioni disponibili
      let dirs = this.getAvailableDirections(tileX, tileY);

      // Direzione attuale
      const currentDir = {
        dx: Math.sign(ghost.body.velocity.x),
        dy: Math.sign(ghost.body.velocity.y)
      };

      // Evita di invertire 180° se ci sono altre scelte
      dirs = dirs.filter(
        d => !(d.dx === -currentDir.dx && d.dy === -currentDir.dy)
      );

      // Se non ne rimangono, allora va bene anche tornare indietro
      if (dirs.length === 0) {
        dirs = this.getAvailableDirections(tileX, tileY);
      }

      if (dirs.length > 0) {
        const chosen = Phaser.Utils.Array.GetRandom(dirs);
        ghost.setVelocity(chosen.dx * ghost.speed, chosen.dy * ghost.speed);
      } else {
        // Se proprio non c'è niente di libero, ferma il fantasma
        ghost.setVelocity(0, 0);
      }
    }
  }

  // Direzioni libere (no muro). Nota: se col < 0 o col >= MAP_COLS
  // non rientra nell’indice => per i canali laterali usiamo il wrap manuale
  getAvailableDirections(tileX, tileY) {
    const dirs = [];
    // sinistra
    if (this.isFree(tileX - 1, tileY)) dirs.push({ dx: -1, dy: 0 });
    // destra
    if (this.isFree(tileX + 1, tileY)) dirs.push({ dx: 1, dy: 0 });
    // su
    if (this.isFree(tileX, tileY - 1)) dirs.push({ dx: 0, dy: -1 });
    // giù
    if (this.isFree(tileX, tileY + 1)) dirs.push({ dx: 0, dy: 1 });
    return dirs;
  }

  // Controlla se la cella [tx, ty] è NON muro.
  // Fuori mappa => considerato non libero (tranne che gestiamo il wrap a parte).
  isFree(tx, ty) {
    if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) {
      return false;
    }
    // Ritorna vero se ≠ 0 (muro)
    return this.mazeData[ty][tx] !== 0;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: MAP_COLS * TILE_SIZE,  // 21 * 16 = 336
  height: MAP_ROWS * TILE_SIZE, // 17 * 16 = 272
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'gameContainer'
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [StartScene, GameScene]
};

new Phaser.Game(config);
