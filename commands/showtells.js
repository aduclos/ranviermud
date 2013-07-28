var CommandUtil = require('../src/command_util').CommandUtil;
exports.command = function (rooms, items, players, npcs, Commands)
{
    return function (args, player)
    {
        var n = args ? args.split(" ")[0] : 10;
        var tells = player.tells.slice(0,n);
        for (var i = 0; i < tells.length; i++){
            player.say(tells[i]);
        }
    }
}
