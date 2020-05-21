const HELP_MESSAGE = 
`Welcome to A2D2 Bot\'s leaderboard!\n\n
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
const NUM_ENTRY_CHARACTERS = 40;

module.exports = {
  name: '!leaderboard',
  description: 'Manages leaderboards for anything following the format',
  execute(msg, args) {
    var admin = require("firebase-admin");
    var db = admin.database().ref("leaderboards");

    msg.channel.send(`Fetching data...`);

    db.once("value", function(snapshot) {
      if (args.length == 0) { // no parameters passed-in
        var leaderboards = "";
        snapshot.forEach(function(childSnapshot) { leaderboards += childSnapshot.key + "\n"} )
        msg.channel.send(`Here are the existing leaderboards:\n${leaderboards}`);
      } else if (args[0].toLowerCase() === 'help') { // help
        msg.author.send(HELP_MESSAGE);
      } else if (args[0].toLowerCase() === 'create') { // create
        var leaderboardName = args[1];
        var sortType = args[2];

        if  (typeof leaderboardName == 'undefined') {
          msg.channel.send(`Missing leaderboard name.  Invoke \"!leaderboard create LEADERBOARD_NAME\"`);
          return;
        } else if (snapshot.hasChild(leaderboardName)) {
          msg.channel.send(`This leaderboard already exists`);
          return;
        }

        if (typeof sortType == 'undefined') {
          sortType = "highest";
        }
        db.child(leaderboardName).update({
          sort_type: sortType.toLowerCase(),
        });

        db.child(leaderboardName).child("entries").push({
          username: "creation_entry",
          score: 0
        });

        msg.channel.send(`Leaderboard made!`);
      } else if (args[0].toLowerCase() === 'delete') { // delete
        var leaderboardName = args[1];

        if  (typeof leaderboardName == 'undefined') {
          msg.channel.send(`Missing leaderboard name.  Invoke \"!leaderboard delete LEADERBOARD_NAME\"`);
          return;
        } else if (!snapshot.hasChild(leaderboardName)) {
          msg.channel.send(`This leaderboard does not exist`);
          return;
        }

        db.child(leaderboardName).remove()
          .then(function() {
            msg.channel.send(`Leaderboard deleted`);
          })
          .catch(function(error) {
            msg.channel.send(`Failed to delete leaderboard`);
          });
      } else if (args[0].toLowerCase() === 'addTo') { // addTo
        // check if leaderboard exists
        // add entry
      } else if (args[0].toLowerCase() === 'removeFrom') { // removeFrom
        // check if leaderboard exists
        // remove matching entry
      } else { // get specific leaderboard's data
        var leaderboardName = args[0];

        if (!snapshot.hasChild(leaderboardName)) {
          msg.channel.send(`This leaderboard does not exist`);
          return;
        }

        var leaderboardStandings = "";
        leaderboardStandings += `\`\`\`${leaderboardName} Top 10\n`;
        leaderboardStandings += `----------------------------------------\n`;

        var sortingType = snapshot.child(leaderboardName).val().sort_type;
        if (sortingType === 'highest') {
          db.child(`${leaderboardName}/entries`).orderByChild("score").limitToLast(10).once("value", function(snapshot) {
            var data = [];
            snapshot.forEach(function(childSnapshot) { data.push({username: childSnapshot.val().username, score: childSnapshot.val().score })})
            var reversedData = data.sort(function (a, b) { return b.score - a.score; });

            reversedData.forEach(element => {
              var spaceAmount = `${element.username}`.length + `${element.score}`.length;
              var space = new Array(NUM_ENTRY_CHARACTERS - spaceAmount).join(' ');
              var entry = `${element.username}${space}${element.score}\n`;
              leaderboardStandings += entry;
            });
            leaderboardStandings += `----------------------------------------\`\`\`\n`;
            msg.channel.send(leaderboardStandings);
          });
        } else {
          db.child(`${leaderboardName}/entries`).orderByChild("score").limitToFirst(10).once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) { 
              var spaceAmount = `${childSnapshot.val().username}`.length + `${childSnapshot.val().score}`.length;
              var space = new Array(NUM_ENTRY_CHARACTERS - spaceAmount).join(' ');
              var entry = `${childSnapshot.val().username}${space}${childSnapshot.val().score}\n`;
              leaderboardStandings += entry;
            });
            leaderboardStandings += `----------------------------------------\`\`\`\n`;
            msg.channel.send(leaderboardStandings);
          });
        }
      }
    })
  },
};
