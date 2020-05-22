const HELP_MESSAGE = 
`Welcome to A2D2 Bot\'s leaderboard!\n\n
A leaderboard can be looked-up using:\n
\"!leaderboard LEADERBOARD_NAME\"\n\n
To create a leaderboard:\n
\"!leaderboard create LEADERBOARD_NAME SORT_TYPE\"\n
Example: \"!leaderboard create PunsLeaderboard A2D2Bot highest\"\n
Example: \"!leaderboard create PunsLeaderboard A2D2Bot lowest\"\n\n
To add an entry to existing leaderboard:\n
\"!leaderboard add LEADERBOARD_NAME USERNAME LEAADERBOARD_VALUE\"\n
Example: \"!leaderboard add PunsLeaderboard A2D2Bot 9000\"\n\n
To remove an entry to existing leaderboard:\n
\"!leaderboard remove LEADERBOARD_NAME USERNAME LEAADERBOARD_VALUE\"\n
Example: \"!leaderboard remove PunsLeaderboard A2D2Bot 9000\"\n\n`;
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
          msg.channel.send(`Leaderboard \"${leaderboardName}\" already exists`);
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
          msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`);
          return;
        }

        db.child(leaderboardName).remove()
          .then(function() {
            msg.channel.send(`Leaderboard deleted`);
          })
          .catch(function(error) {
            msg.channel.send(`Failed to delete leaderboard.  It may not exist.`);
          });
      } else if (args[0].toLowerCase() === 'add') { // add
        var leaderboardName = args[1];
        var username = args[2];
        var score = args[3];
        if  (typeof leaderboardName == 'undefined') {
          msg.channel.send(`Missing leaderboard name.  Invoke \"!leaderboard add LEADERBOARD_NAME USERNAME SCORE\"`);
          return;
        } else if (!snapshot.hasChild(leaderboardName)) {
          msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`);
          return;
        } else if (typeof username == 'undefined') {
          msg.channel.send(`Missing username.  Invoke \"!leaderboard add LEADERBOARD_NAME USERNAME SCORE\"`);
          return;
        } else if (typeof score == 'undefined') {
          msg.channel.send(`Missing score.  Invoke \"!leaderboard add LEADERBOARD_NAME USERNAME SCORE\"`);
          return;
        }

        db.child(leaderboardName).child("entries").push({
          username: username,
          score: score
        });
        msg.channel.send(`Entry added!  Type \"!leaderboard ${leaderboardName}\" to see the updated standings!`);
      } else if (args[0].toLowerCase() === 'remove') { // remove
        var leaderboardName = args[1];
        var username = args[2];
        var score = args[3];
        if  (typeof leaderboardName == 'undefined') {
          msg.channel.send(`Missing leaderboard name.  Invoke \"!leaderboard remove LEADERBOARD_NAME USERNAME SCORE\"`);
          return;
        } else if (!snapshot.hasChild(leaderboardName)) {
          msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`);
          return;
        } else if (typeof username == 'undefined') {
          msg.channel.send(`Missing username.  Invoke \"!leaderboard remove LEADERBOARD_NAME USERNAME SCORE\"`);
          return;
        } else if (typeof score == 'undefined') {
          msg.channel.send(`Missing score.  Invoke \"!leaderboard remove LEADERBOARD_NAME USERNAME SCORE\"`);
          return;
        }

        db.child(`${leaderboardName}/entries`).orderByChild("username").equalTo(username).once("value", 
          function(snapshot) {
            if (!snapshot.exists) {
              console.info(`Failed to delete entry.  Snapshot does not exist.`);
              msg.channel.send(`Failed to delete entry.  It may not exist.`);
              return;
            }
            snapshot.forEach(function(childSnapshot) { 
              console.info(`child: ${JSON.stringify(childSnapshot)}`);
              if (childSnapshot.val().score == score) {
                db.child(`${leaderboardName}/entries/${childSnapshot.key}`).remove()
                .then(function() {
                  console.info(`Entry deleted`);
                  msg.channel.send(`Entry deleted`);
                })
                .catch(function(error) {
                  console.info(`Failed to delete entry from snapshot.`);
                  msg.channel.send(`Failed to delete entry.  It may not exist.`);
                });
              return;
              }
            })
            console.info(`Failed to find entry`);
            msg.channel.send(`Failed to delete entry.  It may not exist.`);
          },
          function(error) {
            console.info(`Remove error: ${error}`);
            msg.channel.send(`Failed to delete entry.  It may not exist.`);
          });
      } else { // get specific leaderboard's data
        var leaderboardName = args[0];

        if (!snapshot.hasChild(leaderboardName)) {
          msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`);
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
              // todo: skip creation_entry
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
              // todo: skip creation_entry
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
