var CommandUtil = require('../src/command_util').CommandUtil;
exports.command = function (rooms, items, players, npcs, Commands)
{
    return function (args, player)
    {
        var i = player.tells.length;
        var n = args ? args.split(" ")[0] : 10;
        n = n > i ? i : n;
        var tells = player.tells.slice(i-n,i);
        for (var i = 0; i < tells.length; i++){
            player.say(tells[i]);
        }
    }
}
