import Phaser, { Physics } from 'phaser';

export default class GameScene extends Phaser.Scene {
  private isPaused: boolean = false;
  private isOver: boolean = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private balloon: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | undefined;
  // private lowerPipe: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | undefined;
  // private upperPipe: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | undefined;
  private pipes: Physics.Arcade.Group | undefined;

  constructor() {
    super('GameScene');
  }

  jump(velocity: number = -220) {
    if(!this.balloon) return;
    this.balloon.body.setVelocityY(velocity);
  }

  preload() {
    this.load.image('sky', 'assets/images/sky.png');
    this.load.image('balloon', 'assets/images/balloon.png');
    this.load.image('pipe', 'assets/images/pipe.png');
  }

  create() {
    const { width, height } = this.scale;
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
    this.balloon = this.physics.add.sprite(width * 0.15, height / 2, 'balloon');
    this.balloon.setGravityY(400);

    this.pipes = this.physics.add.group();
    for(let i=0; i<4; i++){
      const upperPipe = this.pipes.create(0, 0, 'pipe').setImmovable().setOrigin(0, 1);
      const lowerPipe = this.pipes.create(0, 0, 'pipe').setImmovable().setOrigin(0,0);
      this.placePipes(upperPipe, lowerPipe);
    }

    this.pipes.setVelocityX(-200);

    this.physics.add.collider(this.balloon, this.pipes, this.gameOver, undefined, this);
  }

  update() {
    if (this.isPaused || this.isOver) return;
    // Game loop

    if(this.balloon && this.balloon.y > this.scale.height){
      this.gameOver();
    }

    this.recyclePipes();
    
  }

  recyclePipes() {
    if(!this.pipes) return;

    if(this.pipes.getChildren().length < 4) return;

    let uPipe: any = null;
    let lPipe: any = null;

    this.pipes.getChildren().forEach((pipe) => {
      if((pipe as Phaser.Physics.Arcade.Sprite).getBounds().right <= 0){
        if(!uPipe){
          uPipe = pipe;
        }
        else{
          if(uPipe.y < pipe){
            lPipe = uPipe;
            uPipe = pipe;
          }
          else{
            lPipe = pipe;
          }
        }
      }
    });

    if(uPipe && lPipe){
      this.placePipes(uPipe, lPipe);
    }
  }

  placePipes(uPipe: any, lPipe: any){
    uPipe.x = this.getRightMostPipe() + this.getPipeHorizontalDistance();
    uPipe.y = this.getUpperPipePosition(),

    lPipe.x = uPipe.x;
    lPipe.y = uPipe.y + this.getPipeGap();
  }

  getRightMostPipe() {
    let rightX = 0;
    this.pipes?.getChildren().forEach((pipe) => {
      rightX = Math.max(rightX, (pipe as any).x);
    });

    return rightX;
  }

  private togglePause() {
    const { width, height } = this.scale;

    if(this.isOver){
      return;
    }

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
      this.restartGame();
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
    
    if(this.overlay){
      this.overlay.destroy();
      this.overlay = undefined;
    }

    this.time.addEvent({
      delay: 0,
      callback: () => {
        this.scene.restart();
      },
      loop: false,
    })

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

     // exit text
     const exitText = this.add.text(width / 2, height*0.55 + 60 , 'Exit', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    exitText.setInteractive({ useHandCursor: true });
    exitText.on('pointerover', () => {
      this.scene.start('StartScene');
    });

     this.overlay.add([overlay, gameoverText, restartButton, exitText]);
  }

  getPipeGap() {
    return Phaser.Math.Between(150, 350);
  }

  getUpperPipePosition() {
    return Phaser.Math.Between(this.scale.height * 0.2, this.scale.height * 0.6);
  }

  getPipeHorizontalDistance() {
    return Phaser.Math.Between(250, 350);
  }
}
