exports.command = function (rooms, items, players, npcs, Commands)
{
	return function (args, player)
	{
        console.log(args);
		players.eachIf(function(p){
            return p.getName() === args;
        }, function (p) {
			player.say(p.getName() + " - Level " + p.getAttribute("level") + " " + p.getAttribute("class")+"\n"+
                "TestNewLine");
		});
	};
};
