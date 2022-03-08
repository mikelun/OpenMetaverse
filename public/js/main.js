
/**
 * Socket.io socket
 */
let socket;

/**
 * The stream object used to send media
 */
let localStream = null;

/**
 * All peer connections
 */
let peers = {};


/////////// PHASER 3 CONFIG ///////////
var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    },
};

var game = new Phaser.Game(config);

// KEYS
var keyUp, keyDown, keyLeft, keyRight;


// BACKGROUND
var map;


function preload() {
    
    this.load.spritesheet(
      "characters",
      "assets/characterSprite.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
      }
    );
  
    this.load.image('map', 'assets/mainMap.jpeg');
  
  
    this.load.image('sprite', 'assets/spaceShips_001.png');
  
    this.load.image('star', 'assets/star_gold.png');
    keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
}


function create() {
    map = this.add.image(526, 495, 'map');
    map.setScale(2.1);

    navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(stream => {
        console.log('got stream');
        localStream = stream;  
    });

    // ANIMS
    const anims = this.anims;
    anims.create({
        key: "player-walk",
        frames: anims.generateFrameNumbers("characters", { start: 46, end: 49 }),
        frameRate: 8,
        repeat: -1
    });
    anims.create({
        key: "player-walk-back",
        frames: anims.generateFrameNumbers("characters", { start: 65, end: 68 }),
        frameRate: 8,
        repeat: -1
    });



    var self = this;
    this.socket = io();
    socket = this.socket;

    // Initialize audio stream for socket
    initiateAudio(socket);
    
    // Initialize player socket
    initializePlayersSocket(self);

} 

function update() {
    if (this.sprite) {

      var sprite = this.sprite;
      if (keyUp.isDown) {
        sprite.y -= 3;
        //this.sprite.rotation = -3.14;
      }
      if (keyDown.isDown) {
        sprite.y += 3;
        //this.sprite.rotation = 0;
      }
      if (keyLeft.isDown) {
        sprite.x -= 3;
        //this.sprite.rotation = 3.14 / 2;
        sprite.setFlipX(true);
      }
      if (keyRight.isDown) {
        sprite.x += 3;
        //this.sprite.rotation = -3.14 / 2;
        sprite.setFlipX(false);
      }
  
      if (keyLeft.isDown || keyRight.isDown || keyDown.isDown) {
        sprite.anims.play("player-walk", true);
      } else if (keyUp.isDown) {
        sprite.anims.play("player-walk-back", true);
      } else {
        sprite.anims.stop();
      }
  

      // emit player movement
      var x = this.sprite.x;
      var y = this.sprite.y;
      var r = this.sprite.rotation;
      if (this.sprite.oldPosition && (x !== this.sprite.oldPosition.x || y !== this.sprite.oldPosition.y || r !== this.sprite.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.sprite.x, y: this.sprite.y, rotation: this.sprite.rotation });
      }
      // save old position data
      this.sprite.oldPosition = {
        x: this.sprite.x,
        y: this.sprite.y,
        rotation: this.sprite.rotation
      };
    }
  }



