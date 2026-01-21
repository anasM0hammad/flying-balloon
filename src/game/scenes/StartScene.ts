import Phaser from 'phaser';
import { App } from '@capacitor/app';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  preload() {
    this.load.image('sky', 'assets/images/sky.png');
    this.load.image('banner', 'assets/images/banner.png');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    const sky = this.add.image(width / 2, height / 2, 'sky');
    sky.setDisplaySize(width, height);
    const banner = this.add.image(width/2, height / 3.5, 'banner');
    banner.setScale(0.35).setOrigin(0.5,0.5);

    // Title
    // this.add.text(width / 2, height * 0.35, 'Flying Balloon', {
    //   fontSize: '46px',
    //   color: '#ffffff',
    //   fontStyle: 'bold',
    // }).setOrigin(0.5);

    // Start Button
    const startButton = this.createButton(
      width / 2,
      height * 0.55,
      'Start',
      0x4a90e2,
      '#ffffff',
      () => {
        this.scene.start('GameScene');
      }
    );

    // Exit Button
    const exitButton = this.createButton(
      width / 2,
      height * 0.63,
      'Exit',
      0xffffff,
      '#000000',
      async () => {
        try {
          await App.exitApp();
        } catch (error) {
          console.log('Exit not available in browser');
          window.close();
        }
      }
    );

    this.setupButtonInteraction(startButton);
    this.setupButtonInteraction(exitButton);

    // High Score (bottom)
    const highScore = localStorage.getItem('highScore') || '0';
    this.add.text(width / 2, height - 40, `High Score: ${highScore}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    bgColor: number,
    textColor: string,
    onClick: () => void
  ) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 50, bgColor);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(200, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onClick);

    (button as any).bg = bg;

    return button;
  }

  private setupButtonInteraction(button: Phaser.GameObjects.Container) {
    const bg = (button as any).bg;
    const originalColor = bg.fillColor;

    button.on('pointerover', () => {
      bg.setAlpha(0.8);
    });

    button.on('pointerout', () => {
      bg.setAlpha(1);
      bg.setFillStyle(originalColor);
    });
  }
}
