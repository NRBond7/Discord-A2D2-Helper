const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require('./commands');


// Your web app's Firebase configuration
var admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(
    "private_key": process.env.FIREBASE_PRIVATE_KEY,
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: "https://a2d2-bot.firebaseio.com"
});

// var firebaseConfig = {
//   apiKey: "AIzaSyCKk7Zvh-Ix8Th1p5NhR4G6f6b3fxL0_Y8",
//   authDomain: "a2d2-bot.firebaseapp.com",
//   databaseURL: "https://a2d2-bot.firebaseio.com",
//   projectId: "a2d2-bot",
//   storageBucket: "a2d2-bot.appspot.com",
//   messagingSenderId: "540183404084",
//   appId: "1:540183404084:web:27d232759ac2ea3167f461"
// };
// Initialize Firebase
// firebase.initializeApp(firebaseConfig);


Object.keys(botCommands).map(key => {
  bot.commands.set(botCommands[key].name, botCommands[key]);
});

// const TOKEN = process.env.TOKEN;
const TOKEN = process.env.BOT_TOKEN;//BOT_TOKEN is the Client Secret

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
  const args = msg.content.split(/ +/);
  const command = args.shift().toLowerCase();
  console.info(`Called command: ${command}`);

  if (!bot.commands.has(command)) return;

  try {
    bot.commands.get(command).execute(msg, args);
  } catch (error) {
    console.error(error);
    msg.reply('there was an error trying to execute that command!');
  }
});
