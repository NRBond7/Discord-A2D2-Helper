module.exports = {
  name: '!leaderboard',
  description: 'Manages leaderboards for anything following the format',
  execute(msg, args) {
    msg.channel.send(`Entered: ${args}`);

    if (args.length == 0) {
      msg.channel.send(`Missing arguments in leaderboard call.  type \"!leaderboard help\" for more info.`);
    } else if (args[0].toLowerCase() === 'help') {
      // todo: send this to user in DM to prevent clutter?
      // todo: add example to fetch leaderboard
      msg.channel.send(`
Welcome to A2D2 Bot\'s leaderboard!\n\n
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
Example: \"!leaderboard removefrom PunsLeaderboard A2D2Bot 9000\"\n\n
      `);
    }

    // arg0 command
    // arg0/1 - leaderboard name
    // arg2 - username
    // arg3 - value

    // leaderboard code

    // find leaderboard from arg0 or make if doesn't exist
    // add new entry to leaderboard and sort
    // return updated leaderboard to the discord channel
  },
};
