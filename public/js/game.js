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
  scale: {
		zoom: 0.25,
	}
};

var game = new Phaser.Game(config);

const time = 100;



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
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });


  // AUDIO
  const userStatus = {
    microphone: false,
    mute: false,
    username: "user#" + Math.floor(Math.random() * 999999),
    online: false,
  };

  this.socket.emit("userInformation", userStatus);
  
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    console.log("Microphone is on");
    var madiaRecorder = new MediaRecorder(stream);
    madiaRecorder.start();

    var audioChunks = [];

    madiaRecorder.addEventListener("dataavailable", function (event) {
      audioChunks.push(event.data);
    });

    var socket = this.socket;
    madiaRecorder.addEventListener("stop", function () {
      var audioBlob = new Blob(audioChunks);
      audioChunks = [];

      
      var fileReader = new FileReader();
      fileReader.readAsDataURL(audioBlob);
  
      fileReader.onloadend = function () {
      var base64String = fileReader.result;
      //console.log(base64String);
      
      socket.emit("voice", base64String);

      };

      madiaRecorder.start();


      setTimeout(function () {
        madiaRecorder.stop();
      }, time * 10);
    });

    setTimeout(function () {
      madiaRecorder.stop();
    }, time * 10);
  });

  this.socket.on("send", function (data) {
    var audio = new Audio(data);
    audio.play();
  });
    

}

function emitUserInformation() {
  socket.emit("userInformation", userStatus);
}

function addPlayer(self, playerInfo) {
  self.sprite = self.physics.add
      .sprite(400, 400, "characters", 0)
      .setSize(22, 33)
      .setOffset(23, 27);

  self.sprite.anims.play("player-walk-back");
  self.cameras.main.startFollow(self.sprite, true);
  self.cameras.main.setBounds(0, 0, 1000, 1000);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, "characters", 0);

  otherPlayer.anims.play("player-walk");
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);

  // const camera  = this.cameras.main;
  // camera.setBounds(0, 0, 1400, 1400);
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