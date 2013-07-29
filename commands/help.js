var Skills = require('../src/skills').Skills;
var Channels = require('../src/channels').Channels;
var l10n_file = __dirname + '/../l10n/commands/skills.yml';
var l10n = require('../src/l10n')(l10n_file);
var sprintf = require('sprintf').sprintf;

exports.command = function (rooms, items, players, npcs, Commands)
{
	return function (args, player)
	{
		player.say(Object.keys(Channels).length + " Channels:");
		var channelList = [];
		var maxlength = 0;
		for (var channel in Channels) {
			if (channel.length > maxlength) maxlength = channel.length;
			channelList.push(channel);
		}
		channelList.sort();
		for (var i = 1; i < channelList.length+1; i++) {
			player[i % 5 === 0? 'say' : 'write'](sprintf('%-' + (maxlength + 1) + 's', channelList[i-1]));
		}
		player.say("\n");

		player.say(Object.keys(Commands.player_commands).length + " Commands:");
		player.say(Commands.player_commands.commands("", player));

		player.say(Object.keys(Skills).length + " Classes:");
		var pClasses = [];
		var maxlength = 0;
		for (var pClass in Skills) {
			if (pClass.length > maxlength) maxlength = pClass.length;
			pClasses.push(pClass);
		}
		pClasses.sort();
		for (var i = 1; i < pClasses.length+1; i++) {
			player[i % 5 === 0? 'say' : 'write'](sprintf('%-' + (maxlength + 1) + 's', pClasses[i-1]));
		}
		player.say("\n");

		for (var h = 0; h < pClasses.length; h++){
			var pClass = Skills[pClasses[h]];
			player.say(pClasses[h] + " - " + Object.keys(pClass).length + " Skills:");
			var skillList = [];
			var maxlength = 0;
			for (var skill in pClass) {
				if (skill.length > maxlength) maxlength = skill.length;
				skillList.push(skill);
			}
			skillList.sort();
			for (var i = 1; i < skillList.length+1; i++) {
				player[i % 5 === 0? 'say' : 'write'](sprintf('%-' + (maxlength + 1) + 's', skillList[i-1]));
			}
			player.say("\n");
		}
	};
};
