const TEXT_HELP_MESSAGE = 
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
Example: \"!leaderboard remove PunsLeaderboard A2D2Bot 9000\"\n\n`

const MISSING_LEADERBOARD_NAME = `Missing leaderboard name.`

const COMMAND_CREATE = `Invoke \"!leaderboard create LEADERBOARD_NAME\"`
const COMMAND_DELETE = `Invoke \"!leaderboard delete LEADERBOARD_NAME\"`
const COMMAND_ADD = `Invoke \"!leaderboard add LEADERBOARD_NAME USERNAME SCORE\"`
const COMMAND_REMOVE = `Invoke \"!leaderboard remove LEADERBOARD_NAME USERNAME SCORE\"`

const TEXT_DISCORD_CODE_BLOCK = `\`\`\``
const TEXT_HEADER_LINE = `----------------------------------------`
const TEXT_GET_LEADERBOARDS_RESULT = `${TEXT_DISCORD_CODE_BLOCK}Here are the existing leaderboards:\n${TEXT_HEADER_LINE}\n`

const SORT_TYPE_HIGHEST = `highest`
const SORT_TYPE_LOWEST = `lowest`

const ERROR_REMOVAL_NOT_FOUND = `Failed to delete entry.  It may not exist.`

const DATABASE_KEY_ENTRIES = `entries`
const DATABASE_KEY_SCORE = `score`
const DATABASE_KEY_USERNAME = `username`

const LEADERBOARD_CREATION_USERNAME = `creation_entry`

const LEADERBOARD_COUNT = 10

module.exports = {
  name: '!leaderboard',
  description: 'Manages leaderboards.  Enter \"!leaderboard help\" for more info.',
  execute(msg, args) {
    var admin = require("firebase-admin")
    var db = admin.database().ref("leaderboards")

    db.once("value", function(snapshot) {
      if (args.length == 0) {
        handleEmptyCommand(msg, snapshot)
      } else if (args[0].toLowerCase() === 'help') {
        handleHelp(msg)
      } else if (args[0].toLowerCase() === 'create') {
        handleCreate(msg, db)
      } else if (args[0].toLowerCase() === 'delete') {
        handleDelete(args, msg, db)
      } else if (args[0].toLowerCase() === 'add') {
        handleAdd(args, snapshot, db, msg)
      } else if (args[0].toLowerCase() === 'remove') {
        handleRemove(args, snapshot, db, msg)
      } else {
        handleGetLeaderboardData(args, snapshot, msg, db)
      }
    })
  },
}

function handleEmptyCommand(msg, snapshot) {
  var leaderboards = ""
  snapshot.forEach(function(childSnapshot) { leaderboards += childSnapshot.key + "\n"} )
  msg.channel.send(`${TEXT_GET_LEADERBOARDS_RESULT}${leaderboards}${TEXT_HEADER_LINE}${TEXT_DISCORD_CODE_BLOCK}`)
}

function handleHelp(msg) {
  msg.author.send(TEXT_HELP_MESSAGE)
}

function handleCreate(msg, db) {
  var leaderboardName = args[1]
  var sortType = args[2]

  if  (typeof leaderboardName == 'undefined') {
    msg.channel.send(`${MISSING_LEADERBOARD_NAME} ${COMMAND_CREATE}`)
    return
  } else if (snapshot.hasChild(leaderboardName)) {
    msg.channel.send(`Leaderboard \"${leaderboardName}\" already exists`)
    return
  }

  if (typeof sortType == 'undefined') {
    sortType = SORT_TYPE_HIGHEST
  }

  db.child(leaderboardName).update({
    sort_type: sortType.toLowerCase(),
  })

  db.child(leaderboardName).child(DATABASE_KEY_ENTRIES).push({
    username: LEADERBOARD_CREATION_USERNAME,
    score: 0
  })

  msg.channel.send(`Leaderboard made!`)
}

function handleDelete(args, msg, db) {
  var leaderboardName = args[1]

  if  (typeof leaderboardName == 'undefined') {
    msg.channel.send(`${MISSING_LEADERBOARD_NAME}  ${COMMAND_DELETE}`)
    return
  } else if (!snapshot.hasChild(leaderboardName)) {
    msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`)
    return
  }

  db.child(leaderboardName).remove()
    .then(function() {
      msg.channel.send(`Leaderboard deleted`)
    })
    .catch(function(error) {
      msg.channel.send(`Failed to delete leaderboard.  It may not exist.`)
    })
}

function handleAdd(args, snapshot, db, msg) {
  var isMissingArgument = checkForMissingArguments(args, snapshot, COMMAND_ADD)
  if (isMissingArgument) return

  var leaderboardName = args[1]
  var username = args[2]
  var score = args[3]

  db.child(leaderboardName).child(DATABASE_KEY_ENTRIES).push({
    username: username,
    score: score
  })
  msg.channel.send(`Entry added!  Type \"!leaderboard ${leaderboardName}\" to see the updated standings!`)
}

function handleRemove(args, snapshot, db, msg) {
  checkForMissingArguments(args, snapshot, COMMAND_REMOVE)
  if (isMissingArgument) return

  var leaderboardName = args[1]
  var username = args[2]
  var score = args[3]

  db.child(`${leaderboardName}/${DATABASE_KEY_ENTRIES}`).orderByChild(DATABASE_KEY_USERNAME).equalTo(username).once("value", 
    function(snapshot) {
      console.info(`snapshot: ${snapshot.toJSON()}`)
      if (!snapshot.exists() || snapshot.numChildren() == 0) {
        console.info(`Failed to delete entry.  Snapshot does not exist.`)
        msg.channel.send(ERROR_REMOVAL_NOT_FOUND)
        return
      }
      snapshot.forEach(function(childSnapshot) { 
        console.info(`child: ${childSnapshot.toJSON()}`)
        if (childSnapshot.val().score == score) {
          db.child(`${leaderboardName}/${DATABASE_KEY_ENTRIES}/${childSnapshot.key}`).remove()
          .then(function() {
            console.info(`Entry deleted`)
            msg.channel.send(`Entry deleted. Type \"!leaderboard ${leaderboardName}\" to see the updated standings!`)
          })
          .catch(function(error) {
            console.info(`Failed to delete entry from snapshot.`)
            msg.channel.send(ERROR_REMOVAL_NOT_FOUND)
          })
          return true
        }
      })
    },
    function(error) {
      console.info(`Snapshot error: ${error}`)
      msg.channel.send(ERROR_REMOVAL_NOT_FOUND)
      return
    })
}

function handleGetLeaderboardData(args, snapshot, msg, db) {
   var leaderboardName = args[0]

   if (!snapshot.hasChild(leaderboardName)) {
     msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`)
     return
   }

   var leaderboardStandings = ""
   leaderboardStandings += `${TEXT_DISCORD_CODE_BLOCK}${leaderboardName} Top ${LEADERBOARD_COUNT}\n${TEXT_HEADER_LINE}\n`

   var sortingType = snapshot.child(leaderboardName).val().sort_type
   if (sortingType === SORT_TYPE_HIGHEST) {
     db.child(`${leaderboardName}/${DATABASE_KEY_ENTRIES}`).orderByChild(DATABASE_KEY_SCORE).limitToLast(LEADERBOARD_COUNT).once("value", function(snapshot) {
       leaderboardStandings += getLeaderBoardData(snapshot, sortingType)
       msg.channel.send(leaderboardStandings)
     })
   } else if (sortingType === SORT_TYPE_LOWEST) {
     db.child(`${leaderboardName}/${DATABASE_KEY_ENTRIES}`).orderByChild(DATABASE_KEY_SCORE).limitToFirst(LEADERBOARD_COUNT).once("value", function(snapshot) {
       leaderboardStandings += getLeaderBoardData(snapshot, sortingType)
       msg.channel.send(leaderboardStandings)
     })
   }
}

function getLeaderBoardData(snapshot, sortType) {
  var data = []
  snapshot.forEach(function(childSnapshot) { data.push({username: childSnapshot.val().username, score: childSnapshot.val().score })})
  if (sortType === SORT_TYPE_HIGHEST) data = data.sort(function (a, b) { return b.score - a.score })

  data.forEach(element => {
    if (element.username === LEADERBOARD_CREATION_USERNAME) return
    var spaceAmount = `${element.username}`.length + `${element.score}`.length
    var space = new Array(TEXT_HEADER_LINE.length - spaceAmount).join(' ')
    var entry = `${element.username}${space}${element.score}\n`
    leaderboardStandings += entry
  })
  leaderboardStandings += `${TEXT_HEADER_LINE}${TEXT_DISCORD_CODE_BLOCK}\n`
  return leaderboardStandings
}

function checkForMissingArguments(args, snapshot, command) {
  var leaderboardName = args[1]
  var username = args[2]
  var score = args[3]
  if  (typeof leaderboardName == 'undefined') {
    msg.channel.send(`${MISSING_LEADERBOARD_NAME}  ${command}`)
    return true
  } else if (!snapshot.hasChild(leaderboardName)) {
    msg.channel.send(`Leaderboard \"${leaderboardName}\" does not exist`)
    return true
  } else if (typeof username == 'undefined') {
    msg.channel.send(`Missing username.  ${command}`)
    return true
  } else if (typeof score == 'undefined') {
    msg.channel.send(`Missing score.  ${command}`)
    return true
  } else {
    return false
  }
}