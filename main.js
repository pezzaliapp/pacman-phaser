const TILE_SIZE = 16;

//
// SCENA DI START: mostra il titolo e un pulsante “START” per avviare il gioco
//
class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Mostra il titolo
    this.add.text(centerX, centerY - 60, 'PAC‑MAN', { fontSize: '48px', fill: '#fff' })
      .setOrigin(0.5);
    
    // Crea il pulsante START
    const startButton = this.add.text(centerX, centerY + 20, 'START', { fontSize: '32px', fill: '#0f0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
      
    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

//
// SCENA DI GIOCO: logica principale (labirinto, Pac‑Man, fantasmi, controlli e punteggio)
//
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  preload() {
    // Texture per il muro (rettangolo blu)
    const wallGfx = this.make.graphics({ add: false });
    wallGfx.fillStyle(0x0000ff, 1);
    wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    wallGfx.destroy();

    // Texture per Pac‑Man: disegnato come un arco giallo
    const pacmanGfx = this.make.graphics({ add: false });
    pacmanGfx.fillStyle(0xffff00, 1);
    pacmanGfx.slice(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330), false);
    pacmanGfx.fillPath();
    pacmanGfx.generateTexture('pacman', TILE_SIZE, TILE_SIZE);
    pacmanGfx.destroy();

    // Texture per il fantasma: cerchio rosso
    const ghostGfx = this.make.graphics({ add: false });
    ghostGfx.fillStyle(0xff0000, 1);
    ghostGfx.fillCircle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
    ghostGfx.generateTexture('ghost', TILE_SIZE, TILE_SIZE);
    ghostGfx.destroy();

    // Texture per il pellet: piccolo cerchio bianco (8x8)
    const pelletGfx = this.make.graphics({ add: false });
    pelletGfx.fillStyle(0xffffff, 1);
    pelletGfx.fillCircle(4, 4, 4);
    pelletGfx.generateTexture('pellet', 8, 8);
    pelletGfx.destroy();
  }
  
  create() {
    // Definizione del labirinto (matrice 21x17)
    // 0 = muro, 1 = pellet, 2 = spazio vuoto
    this.mazeData = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,1,0],
      [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0],
      [0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,2,2,1,1,0,0,0,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,0,2,1,1,1,1,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,0,2,0,0,0,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,2,2,2,1,1,1,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
      [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];
    
    // Creazione dei gruppi statici per i muri e i pellet
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.staticGroup();
    
    for (let row = 0; row < this.mazeData.length; row++) {
      for (let col = 0; col < this.mazeData[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        if (this.mazeData[row][col] === 0) {
          this.walls.create(x, y, 'wall');
        } else if (this.mazeData[row][col] === 1) {
          this.pellets.create(x, y, 'pellet');
        }
      }
    }
    
    // Creazione di Pac‑Man (posizione iniziale in [1,1])
    this.pacman = this.physics.add.sprite(
      TILE_SIZE * 1 + TILE_SIZE / 2,
      TILE_SIZE * 1 + TILE_SIZE / 2,
      'pacman'
    );
    this.pacman.speed = 80;
    this.pacman.setCollideWorldBounds(true);
    
    // Creazione di un gruppo di fantasmi
    this.ghosts = this.physics.add.group();
    const ghostPositions = [
      { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 8 + TILE_SIZE / 2 },
      { x: TILE_SIZE * 9  + TILE_SIZE / 2, y: TILE_SIZE * 6 + TILE_SIZE / 2 },
      { x: TILE_SIZE * 12 + TILE_SIZE / 2, y: TILE_SIZE * 8 + TILE_SIZE / 2 }
    ];
    ghostPositions.forEach(pos => {
      let ghost = this.physics.add.sprite(pos.x, pos.y, 'ghost');
      ghost.speed = 60;
      ghost.setCollideWorldBounds(true);
      this.ghosts.add(ghost);
    });
    
    // Collisioni: Pac‑Man e fantasmi con i muri
    this.physics.add.collider(this.pacman, this.walls);
    this.physics.add.collider(this.ghosts, this.walls);
    
    // Overlap per la raccolta dei pellet e per la collisione con i fantasmi
    this.physics.add.overlap(this.pacman, this.pellets, this.collectPellet, null, this);
    this.physics.add.overlap(this.pacman, this.ghosts, this.hitGhost, null, this);
    
    // Imposta i controlli da tastiera
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Variabili di gioco
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.updateScorePanel();
    
    // Imposta i controlli tattili (senza azzerare la velocità al rilascio per mantenere il movimento)
    this.setupTouchControls();
  }
  
  update() {
    // Gestione dei controlli da tastiera per Pac‑Man
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
      this.setPacmanVelocity(vx, vy);
    }
    
    // Aggiorna il movimento di ciascun fantasma
    this.ghosts.getChildren().forEach(ghost => {
      this.updateGhost(ghost);
    });
  }
  
  // Imposta la velocità di Pac‑Man e ruota la sprite in base alla direzione
  setPacmanVelocity(vx, vy) {
    this.pacman.setVelocity(vx, vy);
    if (vx > 0) {
      this.pacman.setAngle(0);
    } else if (vx < 0) {
      this.pacman.setAngle(180);
    } else if (vy < 0) {
      this.pacman.setAngle(270);
    } else if (vy > 0) {
      this.pacman.setAngle(90);
    }
  }
  
  // Configura i controlli tattili: utilizza "touchstart" per impostare la direzione
  setupTouchControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    
    const setDirection = (vx, vy) => {
      this.setPacmanVelocity(vx, vy);
    };
    
    // Assegna gli eventi per click e touchstart (non fermare il movimento su touchend)
    [ [btnUp, 0, -this.pacman.speed],
      [btnDown, 0, this.pacman.speed],
      [btnLeft, -this.pacman.speed, 0],
      [btnRight, this.pacman.speed, 0]
    ].forEach(([btn, vx, vy]) => {
      btn.addEventListener('click', () => setDirection(vx, vy));
      btn.addEventListener('touchstart', ev => {
        ev.preventDefault();
        setDirection(vx, vy);
      });
      // Non azzeriamo la velocità su touchend per mantenere un movimento continuo
      btn.addEventListener('mouseup', () => this.setPacmanVelocity(0, 0));
    });
  }
  
  // Quando Pac‑Man raccoglie un pellet
  collectPellet(pacman, pellet) {
    pellet.destroy();
    this.score += 10;
    this.updateScorePanel();
    // Se non ci sono più pellet, aumenta il livello e riavvia la scena
    if (this.pellets.countActive() === 0) {
      this.level++;
      this.updateScorePanel();
      this.scene.restart();
      this.registry.destroy();
      this.events.off();
    }
  }
  
  // Quando Pac‑Man collide con un fantasma
  hitGhost(pacman, ghost) {
    this.lives--;
    this.updateScorePanel();
    this.resetPositions();
    if (this.lives <= 0) {
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.updateScorePanel();
      this.scene.restart();
      this.registry.destroy();
      this.events.off();
    }
  }
  
  // Riposiziona Pac‑Man e i fantasmi alle posizioni iniziali
  resetPositions() {
    this.pacman.setPosition(TILE_SIZE * 1 + TILE_SIZE / 2, TILE_SIZE * 1 + TILE_SIZE / 2);
    this.pacman.setVelocity(0, 0);
    const ghostStarts = [
      { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 8 + TILE_SIZE / 2 },
      { x: TILE_SIZE * 9  + TILE_SIZE / 2, y: TILE_SIZE * 6 + TILE_SIZE / 2 },
      { x: TILE_SIZE * 12 + TILE_SIZE / 2, y: TILE_SIZE * 8 + TILE_SIZE / 2 }
    ];
    let i = 0;
    this.ghosts.getChildren().forEach(ghost => {
      ghost.setPosition(ghostStarts[i].x, ghostStarts[i].y);
      ghost.setVelocity(0, 0);
      i++;
    });
  }
  
  // Aggiorna il pannello punteggio esterno
  updateScorePanel() {
    document.getElementById('scoreLabel').textContent = `Score: ${this.score}`;
    document.getElementById('livesLabel').textContent = `Lives: ${this.lives}`;
    document.getElementById('levelLabel').textContent = `Level: ${this.level}`;
  }
  
  // Aggiorna il movimento del fantasma: quando è vicino al centro della cella (soglia 2px), cambia direzione senza fermarsi
  updateGhost(ghost) {
    const tileX = Math.floor(ghost.x / TILE_SIZE);
    const tileY = Math.floor(ghost.y / TILE_SIZE);
    const centerX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const dist = Phaser.Math.Distance.Between(ghost.x, ghost.y, centerX, centerY);
    if (dist < 2) {
      let dirs = this.getAvailableDirections(tileX, tileY);
      const currentDir = { dx: Math.sign(ghost.body.velocity.x), dy: Math.sign(ghost.body.velocity.y) };
      dirs = dirs.filter(d => !(d.dx === -currentDir.dx && d.dy === -currentDir.dy));
      if (dirs.length === 0) dirs = this.getAvailableDirections(tileX, tileY);
      const chosen = Phaser.Utils.Array.GetRandom(dirs);
      ghost.setVelocity(chosen.dx * ghost.speed, chosen.dy * ghost.speed);
    }
  }
  
  // Restituisce le direzioni libere (non bloccate) intorno a una cella data
  getAvailableDirections(tileX, tileY) {
    const dirs = [];
    if (this.isFree(tileX - 1, tileY)) dirs.push({ dx: -1, dy: 0 });
    if (this.isFree(tileX + 1, tileY)) dirs.push({ dx: 1, dy: 0 });
    if (this.isFree(tileX, tileY - 1)) dirs.push({ dx: 0, dy: -1 });
    if (this.isFree(tileX, tileY + 1)) dirs.push({ dx: 0, dy: 1 });
    return dirs;
  }
  
  // Restituisce true se la cella (tileX, tileY) non è un muro (0)
  isFree(tileX, tileY) {
    if (tileX < 0 || tileX >= this.mazeData[0].length || tileY < 0 || tileY >= this.mazeData.length)
      return false;
    return this.mazeData[tileY][tileX] !== 0;
  }
}

//
// CONFIGURAZIONE DI PHASER: includiamo StartScene e GameScene
//
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 21 * TILE_SIZE,    // 21 colonne
  height: 17 * TILE_SIZE,   // 17 righe
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
  scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);
