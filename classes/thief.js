var Affects  = require('./../src/affects.js').Affects;

var l10n = require('../src/l10n')(__dirname + '/../l10n/skills/thief.yml')
var pl10n = require('../src/l10n')(__dirname + '/../l10n/scripts/player/player.js.yml')

exports.skills = {
    hide: {
        type: 'active',
        level: 2,
        name: "Hide",
        description: "Hide from other players and NPCs",
        cooldown: 6,
        notCombatUsable: function(player){
            player.sayL10n(l10n, 'HIDE_COMBAT');
        },
        offCooldown: function(player){
            player.sayL10n(pl10n, 'COOLDOWN_END', "Test Replacement String");
        },
        activate: function(player, args, rooms, npcs)
        {
            //if (player.getCooldown("hide")) return true;

            player.sayL10n(l10n, 'HIDE_ATTEMPT');

            //player.setCooldown("hide");

            return true;
        }
    }
};
