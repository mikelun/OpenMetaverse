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


// SOCKET
var socket;

// TEXTS
var playerName;

// USER STATUS
const userStatus = {
  microphone: false,
  mute: false,
  username: "user#" + Math.floor(Math.random() * 999999),
  online: false,
  account: "player"
};

function toggleMute(e) {
  userStatus.mute = !userStatus.mute;
  editButtonClass(e, userStatus.mute);
  //emitUserInformation();
  socket.emit("userInformation", userStatus);
}

function editButtonClass(target, bool) {
  const classList = target.classList;
  classList.remove("enable-btn");
  classList.remove("disable-btn");
  // change value of target

  if (bool) {
    target.innerText = "Mute";
    return classList.add("enable-btn");
  }
  
  target.innerText = "Unmute";
  classList.add("disable-btn");
}

// GET METAMASK ACCOUNT
function changePlayerAccount(account) {
  // make sub string of account
  userStatus.account = account.substring(0, 6) + ".." + account.substring(account.length - 4, account.length);
  emitUserInformation();
}

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
  socket = this.socket;
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
        if (!userStatus.mute) return;
      var base64String = fileReader.result;
      //console.log(base64String);
      
      socket.emit("voice", base64String);

      };

      madiaRecorder.start();


      setTimeout(function () {
        madiaRecorder.stop();
      }, time * 7);
    });

    setTimeout(function () {
      madiaRecorder.stop();
    }, time * 7);
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

  // Change texts
  playerName = self.add.text(self.sprite.x, self.sprite.y, "player", {fontSize: '20px', color: '#ffffff'});
}

playerNames = [];

function addOtherPlayers(self, playerInfo) {
  console.log(playerInfo);
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, "characters", 0);
  const otherPlayerName = self.add.text(playerInfo.x, playerInfo.y, playerInfo.account, {fontSize: '20px', color: '#ffffff'});
  otherPlayer.anims.play("player-walk");
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);

  // const camera  = this.cameras.main;
  // camera.setBounds(0, 0, 1400, 1400);
}

function update() {
  if (this.sprite) {
    // WORK WITH TEXTS
    playerName.x = this.sprite.x - 70;
    playerName.y = this.sprite.y - 50;
    // change text of player name
    if (userStatus.account) {
      playerName.setText(userStatus.account);
    }
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