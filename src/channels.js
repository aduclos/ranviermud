var tellL10n = require('../src/l10n')(__dirname + '/../l10n/channels/tell.yml');
var auctionL10n = require('../src/l10n')(__dirname + '/../l10n/channels/auction.yml');
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
				players.eachIf(function(p){
					return p.getName() === target;
				},function(p){
					var playerSeesTarget = player.canSeeTarget(p);
					if (playerSeesTarget){
						var date = new Date().toString().substring(0,24);

						//Echo to target
						var targetSeesPlayer = p.canSeeTarget(player);
						var pName = targetSeesPlayer ? player.getName() : "Someone";
						player.getTell(tellL10n, "TELL_LIST", date, pName, text);

						//Echo to player
						var targetName = playerSeesTarget ? target : "Someone";
						player.sendTell(tellL10n, "TOLD_LIST", date, targetName, text);
					}
					else {
						player.sayL10n(tellL10n,"TELL_FAIL", target);
					}
				});
			}
			else {
				player.sayL10n(tellL10n,"TELL_FAIL", target);
			}
		}
	},

	auction: {
		name: 'auction',
		description: 'Sell items',
		use: function (args, player, players)
		{
			args = args.split(" ");
			if (args.length < 2){
				player.sayL10n(auctionL10n,"AUCTION_ARGS");
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
					player.sayL10n(auctionL10n,"AUCTION_FAIL", item, price);
					return;
				}
			}
			item = CommandUtil.findItemInInventory(item, player, true);
			players.broadcastL10n(auctionL10n, "AUCTION", player.getName(), item.getShortDesc(player.getLocale()), price);
			players.eachExcept(player, function (p) { p.prompt(); });
		}
	},
};
