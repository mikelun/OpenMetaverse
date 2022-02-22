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
  } 
};

var game = new Phaser.Game(config);

// KEYS
var keyUp, keyDown, keyLeft, keyRight;


function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('star', 'assets/star_gold.png');
  keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
}

function create() {
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
      console.log(audioBlob + "BLOOOB");
      audioChunks = [];

      var fileReader = new FileReader();
      fileReader.readAsDataURL(audioBlob);
      console.log(fileReader);
      fileReader.onloadend = function () {
      var base64String = fileReader.result;
      //console.log(base64String);
      socket.emit("voice", base64String);

      };

      madiaRecorder.start();


      setTimeout(function () {
        madiaRecorder.stop();
      }, 1000);
    });

    setTimeout(function () {
      madiaRecorder.stop();
    }, 1000);
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
  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    //otherPlayer.setTint(0x0000ff);
  } else {
    //otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function update() {
  if (this.ship) {
    if (keyUp.isDown) {
      this.ship.y -= 3;
      this.ship.rotation = -3.14;
  }
  if (keyDown.isDown) {
      this.ship.y += 3;
      this.ship.rotation = 0;
  }
  if (keyLeft.isDown) {
    this.ship.x -= 3;
    this.ship.rotation = 3.14 / 2;
  }
  if (keyRight.isDown) {
      this.ship.x += 3;
      this.ship.rotation = -3.14 / 2;
  }
  
  
  
    
    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}