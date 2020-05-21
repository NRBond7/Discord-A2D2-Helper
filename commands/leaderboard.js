const HELP_MESSAGE = `Welcome to A2D2 Bot\'s leaderboard!\n\n
A leaderboard can be looked-up using:\n
\"!leaderboard LEADERBOARD_NAME\"\n\n
To create a leaderboard:\n
\"!leaderboard create LEADERBOARD_NAME SORT_TYPE\"\n
Example: \"!leaderboard create PunsLeaderboard A2D2Bot highest\"\n
Example: \"!leaderboard create PunsLeaderboard A2D2Bot lowest\"\n\n
To add an entry to existing leaderboard:\n
\"!leaderboard addto LEADERBOARD_NAME USERNAME LEAADERBOARD_VALUE\"\n
Example: \"!leaderboard addto PunsLeaderboard A2D2Bot 9000\"\n\n
To remove an entry to existing leaderboard:\n
\"!leaderboard removefrom LEADERBOARD_NAME USERNAME LEAADERBOARD_VALUE\"\n
Example: \"!leaderboard removefrom PunsLeaderboard A2D2Bot 9000\"\n\n`;

module.exports = {
  name: '!leaderboard',
  description: 'Manages leaderboards for anything following the format',
  execute(msg, args) {
    var admin = require("firebase-admin");
    var db = admin.database();

    msg.channel.send(`A2D2 Leaderboard Bot`);
    if (args.length == 0) {
      var ref = db.ref("leaderboards");
      msg.channel.send(`Fetching leaderboards...`);
      ref.once("value", function(snapshot) {
        console.log(snapshot.val());
        var leaderboards = [];
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          leaderboards.push(childSnapshot.key);
        })
        msg.channel.send(`Here are the existing leaderboards:\n${leaderboards}`);
      });
    } 
    // else if (args[0].toLowerCase() === 'help') {
    //   msg.author.send(HELP_MESSAGE);
    // } else if (args[0].toLowerCase() === 'create') {
    //   if  (typeof arg[1] == 'undefined') {
    //     msg.channel.send(`Missing leaderboard name.  Invoke \"!leaderboard LEADERBOARD_NAME\"`);
    //   }

    //   // Check if leaderboard already exists
    //   var leaderboardRef = db.ref(`leaderboards/${arg1}`);
    //   // Check if user passed in arg1 and it's properly formatted
    //   // Create leaderboard
    //   // report back
    // } else if (args[0].toLowerCase() === 'addTo') {
    //   // check if leaderboard exists
    //   // add entry
    // } else if (args[0].toLowerCase() === 'removeFrom') {
    //   // check if leaderboard exists
    //   // remove matching entry
    // } else {
    //   // fetch leaderboard of name arg0
    //   // return and sort entries
    }
  },
};
