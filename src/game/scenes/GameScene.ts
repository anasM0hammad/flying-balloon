import Phaser, { Physics } from 'phaser';

export default class GameScene extends Phaser.Scene {
  private isPaused: boolean = false;
  private isOver: boolean = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private band: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | undefined;

  constructor() {
    super('GameScene');
  }

  jump(velocity: number = -300) {
    if(!this.band) return;
    this.band.body.setVelocityY(velocity);
  }

  preload() {
    this.load.image('sky', 'assets/images/sky.png');
    this.load.image('band', 'assets/images/band.png');
  }

  create() {
    const { width, height } = this.scale;
    if(this.isOver){
      this.restartGame();
    }
    // Add sky background
    const sky = this.add.image(width / 2, height / 2, 'sky');
    sky.setDisplaySize(width, height);

    // Back button (top left)
    const backText = this.add.text(20, 20, 'Back', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    backText.setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => {
      this.scene.start('StartScene');
    });
    backText.on('pointerover', () => {
      backText.setAlpha(0.7);
    });
    backText.on('pointerout', () => {
      backText.setAlpha(1);
    });

    // Pause button (top right)
    const pauseText = this.add.text(width - 20, 20, 'Pause', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    pauseText.setInteractive({ useHandCursor: true });
    pauseText.on('pointerdown', () => {
      this.togglePause();
    });
    pauseText.on('pointerover', () => {
      pauseText.setAlpha(0.7);
    });
    pauseText.on('pointerout', () => {
      pauseText.setAlpha(1);
    });

    this.input.keyboard?.on('keydown-SPACE',() => {
      this.jump();
    });
    // Your game logic here
    this.band = this.physics.add.image(width / 10, height / 2, 'band');
  }

  update() {
    if (this.isPaused || this.isOver) return;
    // Game loop

    if(this.band && this.band.y > this.scale.height){
      this.gameOver();
    }
  }

  private togglePause() {
    const { width, height } = this.scale;

    if (!this.isPaused) {
      // Pause the game
      this.isPaused = true;
      this.physics.pause();

      // Create pause overlay
      this.pauseOverlay = this.add.container(0, 0);
      this.pauseOverlay.setDepth(1000);

      // Semi-transparent background
      const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
      overlay.setOrigin(0);

      // Pause text
      const pausedText = this.add.text(width / 2, height * 0.4, 'Game Paused', {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Resume button
      const resumeButton = this.createResumeButton(width / 2, height * 0.55);

      this.pauseOverlay.add([overlay, pausedText, resumeButton]);
    } else {
      // Resume the game
      this.resumeGame();
    }
  }

  private createResumeButton(x: number, y: number) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 50, 0x4a90e2);
    
    const label = this.add.text(0, 0, 'Resume', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(200, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.resumeGame();
    });

    button.on('pointerover', () => {
      bg.setAlpha(0.8);
    });

    button.on('pointerout', () => {
      bg.setAlpha(1);
    });

    return button;
  }

  private createRestartButton(x: number, y: number) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 50, 0x4a90e2);
    
    const label = this.add.text(0, 0, 'Restart', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(200, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.create();
    });

    button.on('pointerover', () => {
      bg.setAlpha(0.8);
    });

    button.on('pointerout', () => {
      bg.setAlpha(1);
    });

    return button;
  }

  private resumeGame() {
    this.isPaused = false;
    this.physics.resume();
    
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = undefined;
    }
  }

  private restartGame() {
    this.isOver = false;
    this.physics.resume();
    if(this.overlay){
      this.overlay.destroy();
      this.overlay = undefined;
    }

    // Reset the current score also
  }

  private gameOver() {
    const { width, height } = this.scale;

    this.isOver = true;
    this.physics.pause();
    this.overlay = this.add.container(0,0);
    this.overlay.setDepth(1000);

     // Semi-transparent background
     const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
     overlay.setOrigin(0);

     // gameover text
     const gameoverText = this.add.text(width / 2, height * 0.4, 'Game Over', {
       fontSize: '32px',
       color: '#ffffff',
       fontStyle: 'bold',
     }).setOrigin(0.5);

     // Restart button
     const restartButton = this.createRestartButton(width / 2, height * 0.55);

     this.overlay.add([overlay, gameoverText, restartButton]);
  }
}
