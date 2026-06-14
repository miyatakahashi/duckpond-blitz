class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');

    this.add.text(400, 150, 'DUCK POND BLITZ', {
      fontSize: '52px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(400, 230, '— INSERT CREDIT —', {
      fontSize: '20px',
      color: '#333333',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.add.text(400, 340, 'ARROW KEYS or A/D to move', {
      fontSize: '18px',
      color: '#333333',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.add.text(400, 375, 'SPACE to shoot', {
      fontSize: '18px',
      color: '#333333',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const prompt = this.add.text(400, 470, 'PRESS SPACE TO START', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}

let currentWave  = 1;
let currentScore = 0;

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  preload() {
    this.load.image('duck',    'src/assets/duck_yellow.png');
    this.load.image('target',  'src/assets/target_red1.png');
    this.load.image('target2', 'src/assets/target_colored.png');
    this.load.image('bullet',  'src/assets/shot_blue_small.png');
    this.load.image('player',  'src/assets/rifle.png');
    this.load.audio('shoot', 'src/assets/click_002.ogg');

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff8800);
    g.fillCircle(6, 6, 6);
    g.generateTexture('feather', 12, 12);
    g.destroy();
  }

  create() {
    this.init_game();
  }

  init_game() {
    this.children.removeAll();

    this.score      = currentScore;
    this.lives      = 3;
    this.wave       = currentWave;
    this.waveActive = true;

    this.player = this.physics.add.image(400, 560, 'player');
    this.player.setScale(0.5);
    this.player.setCollideWorldBounds(true);

    this.targets  = this.physics.add.group();
    this.bullets  = this.physics.add.group();
    this.feathers = this.physics.add.group();
    this.ducks    = this.physics.add.group();

    const speed = 100 + (this.wave - 1) * 30;
    const rows  = Math.min(this.wave + 1, 3);

    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < 5; i++) {
        const t = this.targets.create(100 + i * 130, 130 + row * 90, 'target');
        t.setScale(0.6);
        t.body.setVelocityX(row % 2 === 0 ? speed : -speed);
        t.hp = 1;
      }
    }

    const duckDelay = Math.max(3000 - (this.wave - 1) * 300, 1200);
    this.duckTimer = this.time.addEvent({
      delay: duckDelay,
      callback: this.spawnDuck,
      callbackScope: this,
      loop: true
    });

    this.scoreTxt = this.add.text(10, 10, 'Score: ' + this.score, { color: '#fff', fontSize: '18px' });
    this.livesTxt = this.add.text(10, 35, 'Lives: ' + this.lives,  { color: '#f44', fontSize: '18px' });
    this.waveTxt  = this.add.text(700, 10, 'Wave: ' + this.wave,   { color: '#ff0', fontSize: '18px' });

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.physics.add.overlap(this.bullets,  this.targets,  this.hitTarget, null, this);
    this.physics.add.overlap(this.bullets,  this.ducks,    this.hitDuck,   null, this);
    this.physics.add.overlap(this.feathers, this.player,   this.playerHit, null, this);
  }

  spawnDuck() {
    if (!this.waveActive) return;

    const fromLeft = Phaser.Math.Between(0, 1) === 1;
    const x        = fromLeft ? -30 : 830;
    const speedX   = fromLeft ? 180 : -180;
    const startY   = Phaser.Math.Between(150, 380);

    const duck = this.ducks.create(x, startY, 'duck');
    duck.setScale(0.5);
    duck.setFlipX(!fromLeft);
    duck.body.setVelocityX(speedX);
    duck.fromLeft  = fromLeft;
    duck.startY    = startY;
    duck.spawnTime = this.time.now; // wave movement
  }

  hitTarget(bullet, target) {
    bullet.destroy();
    target.destroy();
    this.score += 100;
    currentScore = this.score;
    this.scoreTxt.setText('Score: ' + this.score);
    if (this.targets.countActive() === 0) this.nextWave();
  }

  hitDuck(bullet, duck) {
    bullet.destroy();
    duck.destroy();
    this.score += 150;
    currentScore = this.score;
    this.scoreTxt.setText('Score: ' + this.score);
  }

  playerHit(feather, player) {
    feather.destroy();
    this.lives--;
    this.livesTxt.setText('Lives: ' + this.lives);
    if (this.lives <= 0) this.endGame();
  }

  nextWave() {
    this.waveActive = false;
    if (this.duckTimer) this.duckTimer.remove();
    currentWave++;

    this.add.text(400, 300, 'WAVE CLEAR!', { color: '#ff0', fontSize: '32px' }).setOrigin(0.5);
    this.time.delayedCall(2000, () => this.scene.restart());
  }

  endGame() {
    this.waveActive = false;
    if (this.duckTimer) this.duckTimer.remove();

    currentWave  = 1;
    currentScore = 0;

    this.add.text(400, 260, 'GAME OVER',            { color: '#f00', fontSize: '48px' }).setOrigin(0.5);
    this.add.text(400, 330, 'Score: ' + this.score, { color: '#fff', fontSize: '24px' }).setOrigin(0.5);
    this.add.text(400, 390, 'Wave: '  + this.wave,  { color: '#aaa', fontSize: '20px' }).setOrigin(0.5);
    this.add.text(400, 460, 'Press R to restart',   { color: '#aaa', fontSize: '18px' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-R', () => this.scene.start('TitleScene'));
  }

  update() {
    if (!this.waveActive) return;

    if (this.cursors.left.isDown)       this.player.body.setVelocityX(-300);
    else if (this.cursors.right.isDown) this.player.body.setVelocityX(300);
    else                                this.player.body.setVelocityX(0);

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      const b = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
      b.setScale(0.8);
      b.body.setVelocityY(-500);
      this.sound.play('shoot');
    }

    this.targets.getChildren().forEach(t => {
      if (!t.active) return;
      if (t.x <= t.displayWidth / 2) {
        t.x = t.displayWidth / 2;
        t.body.setVelocityX(Math.abs(t.body.velocity.x));
      } else if (t.x >= 800 - t.displayWidth / 2) {
        t.x = 800 - t.displayWidth / 2;
        t.body.setVelocityX(-Math.abs(t.body.velocity.x));
      }
    });

    this.ducks.getChildren().forEach(duck => {
      if (!duck.active) return;

      const elapsed = this.time.now - duck.spawnTime;
      duck.y = duck.startY + Math.sin(elapsed / 300) * 40;

      const escaped = duck.fromLeft ? duck.x > 850 : duck.x < -50;
      if (escaped) {
        const f = this.feathers.create(duck.x, duck.y, 'feather');
        const angle = Phaser.Math.Angle.Between(duck.x, duck.y, this.player.x, this.player.y);
        this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 200, f.body.velocity);
        duck.destroy();
      }
    });

    this.bullets.getChildren().forEach(b => {
      if (b.active && b.y < 0) b.destroy();
    });

    this.feathers.getChildren().forEach(f => {
      if (f.active && f.y > 620) f.destroy();
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#87CEEB',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [TitleScene, GameScene]
};

new Phaser.Game(config);