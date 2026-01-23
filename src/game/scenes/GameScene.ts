import Phaser, { Physics } from 'phaser';

export default class GameScene extends Phaser.Scene {
  private isPaused: boolean = false;
  private isOver: boolean = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private balloon: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  private pipes: Physics.Arcade.Group | undefined;
  private score: number;
  private scoreText: Phaser.GameObjects.Text | undefined;
  private coin: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  private isCoin: number;
  private coinGap: number = 10;
  private horizontalGapRange = [250, 350];
  private verticalGapRange = [120, 180];
  private pipeSpeed: number = -200;
  private difficulties = ['easy', 'medium', 'hard', 'pro', 'expert'];
  private currentDifficulty = this.difficulties[0];
  private jumpVelocity = -220;
  private gravity = 500;

  constructor() {
    super('GameScene');
    this.score = 0;
    this.isCoin = 0;
    this.isOver = false;
  }

  init() {
    this.score = 0;
    this.isCoin = 0;
    this.isOver = false;
    this.currentDifficulty = this.difficulties[0];
    this.jumpVelocity = -220;
    this.gravity = 500;
  }

  preload() {
    this.load.image('sky', 'assets/images/sky.png');
    this.load.spritesheet('balloon', 'assets/images/balloonSprite.png', {
      frameWidth: 162,
      frameHeight: 240
    });
    this.load.image('pipe', 'assets/images/towerSprite.png');
    this.load.spritesheet('coin', 'assets/images/coin.png', {
      frameWidth: 180,
      frameHeight: 210
    });
    this.load.audio('ding', 'assets/sounds/ding.mp3');
    this.load.audio('crash', 'assets/sounds/crash.mp3');
    this.load.audio('swoosh', 'assets/sounds/swoosh.mp3');
  }

  create() {
    const { width, height } = this.scale;
    // Add sky background
    const sky = this.add.image(width / 2, height / 2, 'sky');
    sky.setDisplaySize(width, height);

    this.input.keyboard?.on('keydown-SPACE',() => {
      this.jump(this.jumpVelocity);
    });

    this.input.on('pointerdown', () => {
      this.jump(this.jumpVelocity);
    });
    // Your game logic here
    this.coin = this.physics.add.sprite(0, 0, 'coin').setScale(0.18).setOrigin(0.5,0.5);
    this.balloon = this.physics.add.sprite(width * 0.15, height / 2, 'balloon').setDisplaySize(40, 60);
    this.balloon.setGravityY(this.gravity);
    this.balloon.setCircle(this.balloon.displayWidth * 2.1, 0, 0);

    this.pipes = this.physics.add.group();
    for(let i=0; i<4; i++){
      const upperPipe = this.pipes.create(0, 0, 'pipe').setImmovable().setOrigin(0, 1).setFlipY(true);
      const lowerPipe = this.pipes.create(0, 0, 'pipe').setImmovable().setOrigin(0,0);
      this.placePipes(upperPipe, lowerPipe, i===3);
    }

    this.pipes.setVelocityX(this.pipeSpeed);
    this.coin.setVelocityX(this.pipeSpeed);

    this.physics.add.collider(this.balloon, this.pipes, this.gameOver, undefined, this);
    this.createScore();
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

    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('balloon', { start: 13, end: 15 }),
      frameRate: 10,
      repeat: 0,
      duration: 200,
    });

    this.anims.create({
      key: 'coin',
      frameRate: 3,
      repeat: -1,
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 4 })
    });

    this.balloon.on('animationcomplete', (animation: any) => {
      if (animation.key === 'fly') {
          this.balloon?.setFrame(0); // Replace 0 with your initial frame index or key
      }
    });
    this.sound.add('ding');
    this.sound.add('crash');
    this.sound.add('swoosh', {
      volume: 0.2
    });
    this.coin.play('coin');
  }

  update() {
    if (this.isPaused || this.isOver) return;
    // Game loop

    if(this.balloon && (this.balloon.y > this.scale.height || this.balloon.y <= 0)){
      console.log('run', this.isOver);
      this.gameOver();
    }

    this.recyclePipes();
    this.collectCoin();
    this.setDifficulty();
    this.executeDifficulty();
  }

  setDifficulty(){
    if(this.score < 20){
      this.currentDifficulty = this.difficulties[0];
    }
    else if(this.score >= 20 && this.score < 50){
      this.currentDifficulty = this.difficulties[1];
    }
    else if(this.score >= 50 && this.score < 70){
      this.currentDifficulty = this.difficulties[2];
    }
    else if(this.score >= 70 && this.score < 100){
      this.currentDifficulty = this.difficulties[3];
    }
    else{
      this.currentDifficulty = this.difficulties[4];
    }
  }

  executeDifficulty(){
    if(this.currentDifficulty === this.difficulties[0]){
      this.horizontalGapRange = [250, 350];
      this.verticalGapRange = [120, 180];
      this.pipeSpeed = -200;
      this.jumpVelocity = -200;
      this.gravity = 500;
    }
    else if(this.currentDifficulty === this.difficulties[1]){
      this.horizontalGapRange = [230, 320];
      this.verticalGapRange = [110, 170];
      this.pipeSpeed = -230;
      this.jumpVelocity = -180;
      this.gravity = 550;
    }
    else if(this.currentDifficulty === this.difficulties[2]){
      this.horizontalGapRange = [215, 310];
      this.verticalGapRange = [90, 140];
      this.pipeSpeed = -250;
      this.jumpVelocity = -250;
      this.gravity = 450;
    }
    else if(this.currentDifficulty === this.difficulties[3]){
      this.horizontalGapRange = [205, 300];
      this.verticalGapRange = [80, 100];
      this.pipeSpeed = -265;
      this.jumpVelocity = -280;
      this.gravity = 420;
    }
    else {
      this.horizontalGapRange = [190, 295];
      this.verticalGapRange = [70, 90];
      this.pipeSpeed = -300;
      this.jumpVelocity = -250;
      this.gravity = 650;
    }

    this.pipes?.setVelocityX(this.pipeSpeed);
    this.coin?.setVelocityX(this.pipeSpeed);
  }

  createScore(){
    this.scoreText = this.add.text(this.scale.width * 0.5, 20, `Score: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
  }

  collectCoin(){
    const collide = this.physics.overlap(this.balloon as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, this.coin as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
    if(collide){
      this.time.delayedCall(100, () => {
        if(this.coin && this.coin.alpha !== 0){
          this.sound.play('ding', { loop: false });
          this.score += 5;
          const coinText = this.add.text(this.coin?.x, this.coin?.y - 20, '+5', {
            fontSize: '22px',
          })
          this.time.delayedCall(250, () => {
            coinText.destroy();
          });
        }
        this.coin?.setAlpha(0);
      });
    }
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
      this.isCoin++;
      this.placePipes(uPipe, lPipe, !Boolean(this.isCoin % 4 && this.isCoin > 0));
      this.increaseScore();
    }
  }

  placePipes(uPipe: any, lPipe: any, isCoin: boolean = false){
    uPipe.x = this.getRightMostPipe() + this.getPipeHorizontalDistance();
    uPipe.y = this.getUpperPipePosition(),

    lPipe.x = uPipe.x;
    lPipe.y = uPipe.y + this.getPipeGap();

    if(isCoin){
      this.placeCoin(uPipe.y, lPipe.y, lPipe.x);
    }
  }

  placeCoin(upperY: number, lowerY: number, x: number) {
    this.coin?.setAlpha(1);
    const position = Phaser.Math.Between(upperY + this.coinGap, lowerY - this.coinGap);
    this.coin?.setX(x + 18);
    this.coin?.setY(position);
  }

  getRightMostPipe() {
    let rightX = 0;
    this.pipes?.getChildren().forEach((pipe) => {
      rightX = Math.max(rightX, (pipe as any).x);
    });

    return rightX;
  }

  increaseScore(points: number = 1){
    this.score += points;
    this.scoreText?.setText(`Score ${this.score}`);
  }

  jump(velocity: number = -220) {
    if(!this.balloon || this.isPaused || this.isOver) return;
    this.balloon.body.setVelocityY(velocity);
    this.balloon.play('fly');
    this.sound.play('swoosh');
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
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = undefined;
    }

    let countDown = 3;
    let countDownText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, `Fly in ${countDown}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    const timeEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countDown--;
        countDownText.setText(`Fly in ${countDown}`);
        if(countDown <= 0){
          countDownText.setText('');
            this.isPaused = false;
            this.physics.resume();
            timeEvent.remove();
        }
      },
      loop: true
    });
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
    });

    this.balloon?.setPosition(this.scale.width * 0.15, this.scale.height / 2);
    // Reset the current score also
  }

  private gameOver() {
    const { width, height } = this.scale;
    if(this.isOver) return;

    this.isOver = true;
    this.physics.pause();
    this.sound.play('crash');
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
     this.setHighScore();
     this.isCoin = 0;
  }

  setHighScore(){
    const highScore = localStorage.getItem('highScore') || 0;
    if(this.score > +highScore){
      localStorage.setItem('highScore', this.score.toString());
    }
    this.score = 0;
  }

  getPipeGap() {
    return Phaser.Math.Between(this.verticalGapRange[0], this.verticalGapRange[1]);
  }

  getUpperPipePosition() {
    return Phaser.Math.Between(this.scale.height * 0.2, this.scale.height * 0.6);
  }

  getPipeHorizontalDistance() {
    return Phaser.Math.Between(this.horizontalGapRange[0], this.horizontalGapRange[1]);
  }
}
