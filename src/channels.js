var l10n_file = __dirname + '/../l10n/commands/auction.yml';
var l10n = require('../src/l10n')(l10n_file);
var CommandUtil = require('../src/command_util').CommandUtil;
exports.Channels = {
	say: {
		name: 'say',
		description: 'Talk to those around you',
		use: function (args, player, players)
		{
			args = args.replace("\033", '');
			players.broadcastAt("<bold><cyan>" + player.getName() + "</cyan></bold> says '" + args + "'", player);
			players.eachExcept(player, function (p) {
				if (p.getLocation() === player.getLocation()) {
					p.prompt();
				}
			});
		}
	},

	chat: {
		name: 'chat',
		description: 'Talk to everyone online',
		use: function (args, player, players)
		{
			args = args.replace("\033", '');
			players.broadcast("<bold><magenta>[chat] " + player.getName() + ": " + args + "</magenta></bold>", player);
			players.eachExcept(player, function (p) { p.prompt(); });
		}
	},

	tell: {
		name: 'tell',
		description: 'Talk to a specific person',
		use: function (args, player, players)
		{
			var nameEnd = args.indexOf(" ");
			var target = args.substring(0,nameEnd);
			var text = args.substring(nameEnd);
			var exists = players.some(function(p){ return p.getName() === target; });
			if (exists){
				var tell = "<red><bold>" + player.getName() + " told you: </bold>" + text + "</red>";
				players.eachIf(function(p){
					return p.getName() === target;
				},function(p){
					p.tells.push(tell);
					p.tells.slice(0,30);
					p.say(tell);
				});
				//players.broadcastIf("<bold><magenta>" + player.getName() + " told you: " + text + "</magenta></bold>", function(p){return p.getName() === target; });
				var told = "<bold><red>You told " + target + ": " + text + "</red></bold>";
				player.told.push(told);
				player.told.slice(0,30);
				player.say(told);
				//player.say("<bold><magenta>You told " + target + ": " + text + "</magenta></bold>", player);
			}
			else {
				player.say("<bold><magenta>" + target + " is not logged in.</magenta></bold>", player);
			}
			players.eachIf(function(p){ return p.getName() === player || p.getName() === target; }, function (p) { p.prompt(); });
		}
	},

	auction: {
		name: 'auction',
		description: 'Sell items',
		use: function (args, player, players)
		{
			args = args.split(" ");
			if (args.length < 2){
				player.sayL10n(l10n,"AUCTION_ARGS");
				return;
			}
			else {
				var item = args[0];
				var price = args[1];
				if (isNaN(args[0]) && !isNaN(args[1])){

				}
				else if (isNaN(args[1]) && !isNaN(args[0])){
					item = args[1];
					price = args[0];
				}
				else {
					player.sayL10n(l10n,"AUCTION_FAIL", item, price);
					return;
				}
			}
			item = CommandUtil.findItemInInventory(item, player, true);
			players.broadcastL10n(l10n, "AUCTION", player.getName(), item.getShortDesc(player.getLocale()), price);
			players.eachExcept(player, function (p) { p.prompt(); });
		}
	},
};
