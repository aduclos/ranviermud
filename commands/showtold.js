var CommandUtil = require('../src/command_util').CommandUtil;
exports.command = function (rooms, items, players, npcs, Commands)
{
    return function (args, player)
    {
        var i = player.told.length;
        var n = args ? args.split(" ")[0] : 10;
        n = n > i ? i : n;
        var told = player.told.slice(i-n,i);
        for (var i = 0; i < told.length; i++){
            player.say(told[i]);
        }
    }
}
