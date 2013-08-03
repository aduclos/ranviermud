var Data    = require('./data').Data,
    Skills  = require('./skills').Skills,
    crypto  = require('crypto'),
    ansi    = require('sty'),
    util    = require('util');
    events  = require('events');


var npcs_scripts_dir = __dirname + '/../scripts/player/';
var l10n_dir         = __dirname + '/../l10n/scripts/player/';
var l10n_file 		 = __dirname + '/../l10n/scripts/player/player.js.yml';
var l10n 			 = require('./l10n')(l10n_file);

var Player = function(socket) {
	var self = this;
	self.name     = '';
	self.descriotion = '';
	self.location = null;
	self.locale   = null;
	self.prompt_string = '%health/%max_healthHP>';
	self.combat_prompt =
	   "<bold>[%health/%max_healthHP] 0--{======> %target_name: [%target_health/%target_max_health]</bold>\r\n>";
	self.password = null;
	self.inventory = [];
	self.equipment = {};

	// In combat is either false or an NPC vnum
	self.in_combat = false;

	// Attributes
	self.attributes = {
		max_health: 100,
		health : 100,
		level: 1,
		experience: 0,
		'class': ''
	};

	// Anything affecting the player
	self.affects = {
	};

	// Skills the players has
	self.skills = {
	};

	self.tells = [];
	self.told = [];

	/**#@+
	 * Mutators
	 */
	self.getPrompt       = function () { return self.prompt_string; };
	self.getCombatPrompt = function () { return self.combat_prompt; };
	self.getLocale       = function () { return self.locale; };
	self.getName         = function () { return self.name; };
	self.getLocation     = function () { return self.location; };
	self.getSocket       = function () { return socket; };
	self.getInventory    = function () { return self.inventory; };
	self.getAttribute    = function (attr)  { return typeof self.attributes[attr] !== 'undefined' ? self.attributes[attr] : false; };
	self.getSkills       = function (skill) { return typeof self.skills[skill] !== 'undefined'    ? self.skills[skill]    : self.skills; };
	// Note, only retreives hash, not a real password
	self.getPassword     = function () { return self.password; };
	self.isInCombat      = function () { return self.in_combat; };
	self.setPrompt       = function (str)       { self.prompt_string = str; }
	self.setCombatPrompt = function (str)       { self.combat_prompt = str; }
	self.setLocale       = function (locale)    { self.locale = locale; };
	self.setName         = function (newname)   { self.name = newname; };
	self.setLocation     = function (loc)       { self.location = loc; };
	self.setPassword     = function (pass)      { self.password = crypto.createHash('md5').update(pass).digest('hex'); };
	self.addItem         = function (item)      { self.inventory.push(item); };
	self.removeItem      = function (item)      { self.inventory = self.inventory.filter(function (i) { return item !== i; }); };
	self.setInventory    = function (inv)       { self.inventory = inv; };
	self.setInCombat     = function (combat)    { self.in_combat = combat; };
	self.setAttribute    = function (attr, val) { self.attributes[attr] = val; };
	self.addSkill        = function (name, skill) { self.skills[name] = skill; };
	/**#@-*/

	/**
	 * Can a player see a target?
	 * @param object item/player/mob
	 * @return boolean
	 */
	self.canSeeTarget = function (target) {
		if (self.getAffects("true_sight")) return true;
		if (self.getAffects("blind")){
			return false;
		}
		if (target.getAffects("hidden")){
			if (!self.getAffects("detect_hidden")){
				return false;
			}
		}
		if (target.getAffects("invisible")){
			if (!self.getAffects("detect_invisible")){
				return false;
			}
		}
		return true;
	};

	/**
	 * Can a player see a target move?
	 * @param object item/player/mob
	 * @return boolean
	 */
	self.canSeeTargetMove = function (target) {
		if (self.getAffects("true_sight")) return true;
		if (self.getAffects("blind")){
			return false;
		}
		if (target.getAffects("sneak")){
			if (!self.getAffects("detect_hidden")){
				return false;
			}
		}
		return true;
	};

	/**
	 * Can a player see a target move?
	 * @param object item/player/mob
	 * @return boolean
	 */
	self.getMoveMode = function (target) {
		if (self.getAffects("fly")) {
			return "flies";
		}
		if (self.getAffects("hidden")){
			return "sneaks";
		}
		if (self.getAffects("swimming")){
			return "swims";
		}
		if (self.getAffects("mounted")){
			return "rides";
		}
		return false;
	};

	/**
	 * Get a player's physical condition
	 * @return string
	 */
	self.getCondition = function () {
		var condition = self.getName() + " is in perfect heath.";
		if (self.getAttribute("health") < self.getAttribute("max_health")){
			condition = self.getName() + " is injured.";
		}
		return condition;
	};

	/**
	 * Get a player's description
	 * @return string
	 */
	self.getDescription = function ()
	{
		return self.description;
	};

	/**
	 * Is skill usable in combat?
	 * @param string aff
	 * @return Array|Object
	 */
	self.notCombatUsable = function (name)
	{
		var skill = Skills[self.getAttribute("class")][name];
        return skill.notCombatUsable;
	};

	/**
	 * Get a cooldown
	 * @param string aff
	 * @return Array|Object
	 */
	self.getCooldown = function (name)
	{
		var skill = Skills[self.getAttribute("class")][name];
		if (self.getAffects('cooldown_'+name)) {
			if (skill.onCooldown) {
				skill.onCooldown(self);
			}
			else {
				self.sayL10n(l10n, 'COOLDOWN');
			}
			return true;
		}
	};

	/**
	 * Set a cooldown
	 * @param string aff
	 * @return Array|Object
	 */
	self.setCooldown = function (name)
	{
		var skill = Skills[self.getAttribute("class")][name];
		if (skill.cooldown){
			self.addAffect('cooldown_'+name, {
				duration: skill.cooldown,
				deactivate: function () {
					if (skill.offCooldown) {
						skill.offCooldown(self);
					}
					else {
						self.sayL10n(l10n, 'COOLDOWN_END', skill.name);
					}
				}
			});
		}
	};

	/**
	 * Get currently applied affects
	 * @param string aff
	 * @return Array|Object
	 */
	self.getAffects = function (aff)
	{
		if (aff) {
			return typeof self.affects[aff] !== 'undefined' ? self.affects[aff] : false;
		}
		return self.affects;
	};

	/**
	 * Add, activate and set a timer for an affect
	 * @param string name
	 * @param object affect
	 */
	self.addAffect = function (name, affect)
	{
		if (affect.activate) {
			affect.activate();
		}

		var deact = function () {
			if (affect.deactivate) {
				affect.deactivate();
				self.prompt();
			}
			self.removeAffect(name);
		};

		if (affect.duration) {
			affect.timer = setTimeout(deact, affect.duration * 1000);
		} else if (affect.event) {
			self.on(affect.event, deact);
		}
		self.affects[name] = affect;
	};

	self.removeAffect = function (aff)
	{
		if (self.affects[aff].event) {
			self.removeListener(self.affects[aff].event, self.affects[aff].deactivate);
		} else {
			clearTimeout(self.affects[aff].timer);
		}
		delete self.affects[aff];
	};

	/**
	 * Get and possibly hydrate an equipped item
	 * @param string  slot    Slot the item is equipped in
	 * @param boolean hydrate Return an actual item or just the uuid
	 * @return string|Item
	 */
	self.getEquipped = function (slot, hydrate)
	{
		if (!slot) {
			return self.equipment;
		}

		if (!(slot in self.equipment)) {
			return false;
		}

		hydrate = hydrate || false;
		if (hydrate) {
			return self.getInventory().filter(function (i) { return i.getUuid() === self.equipment[slot]; })[0];
		}
		return self.equipment[slot];
	};

	/**
	 * "equip" an item
	 * @param string wear_location The location this item is worn
	 * @param Item   item
	 */
	self.equip = function (wear_location, item)
	{
		self.equipment[wear_location] = item.getUuid();
		item.setEquipped(true);
	};

	/**
	 * "unequip" an item
	 * @param Item   item
	 */
	self.unequip = function (item)
	{
		item.setEquipped(false);
		for (var i in self.equipment) {
			if (self.equipment[i] === item.getUuid()) {
				delete self.equipment[i];
				break;
			}
		}
		item.emit('remove', self);
	};

	/**
	 * Write to a player's socket
	 * @param string data Stuff to write
	 */
	self.write = function (data, color)
	{
		color = color || true;
		if (!color) ansi.disable();
		socket.write(ansi.parse(data));
		ansi.enable();
	};

	/**
	 * Write based on player's locale
	 * @param Localize l10n
	 * @param string   key
	 * @param ...
	 */
	self.writeL10n = function (l10n, key)
	{
		var locale = l10n.locale;
		if (self.getLocale()) {
			l10n.setLocale(self.getLocale());
		}

		self.write(l10n.translate.apply(null, [].slice.call(arguments).slice(1)));

		if (locale) l10n.setLocale(locale);
	};

	/**
	 * write() + newline
	 * @see self.write
	 */
	self.say = function (data, color)
	{
		color = color || true;
		if (!color) ansi.disable();
		socket.write(ansi.parse(data) + "\r\n");
		ansi.enable();
	};

	/**
	 * writeL10n() + newline
	 * @see self.writeL10n
	 */
	self.sayL10n = function (l10n, key)
	{
		var locale = l10n.locale;
		if (self.getLocale()) {
			l10n.setLocale(self.getLocale());
		}

		self.say(l10n.translate.apply(null, [].slice.call(arguments).slice(1)));
		if (locale) l10n.setLocale(locale);
	};

	/**
	 * receive a tell and write it into tells array
	 */
	self.getTell = function (l10n)
	{
		var locale = l10n.locale;
		if (self.getLocale()) {
			l10n.setLocale(self.getLocale());
		}

		self.tells.push(l10n.translate.apply(null, [].slice.call(arguments).slice(1)));
		self.tells = self.tells.slice(self.tells.length-30,self.tells.length);
		self.sayL10n(l10n,"TELL_GET", arguments[3], arguments[4]);
		if (locale) l10n.setLocale(locale);
	};

	/**
	 * send a tell and write it into told array
	 */
	self.sendTell = function (l10n)
	{
		var locale = l10n.locale;
		if (self.getLocale()) {
			l10n.setLocale(self.getLocale());
		}

		self.told.push(l10n.translate.apply(null, [].slice.call(arguments).slice(1)));
		self.told = self.told.slice(self.told.length-30,self.told.length);
		self.sayL10n(l10n,"TELL_SEND", arguments[3], arguments[4]);
		if (locale) l10n.setLocale(locale);
	};

	/**
	 * Display the configured prompt to the player
	 * @param object extra Other data to show
	 */
	self.prompt = function (extra)
	{
		extra = extra || {};

		var pstring = self.getPrompt();
		for (var attr in self.attributes) {
			pstring = pstring.replace("%" + attr, self.attributes[attr]);
		}

		for (var data in extra) {
			pstring = pstring.replace("%" + data, extra[data]);
		}

		pstring = pstring.replace(/%[a-z_]+?/, '');
		self.write("\r\n" + pstring);
	};

	/**
	 * @see self.prompt
	 */
	self.combatPrompt = function (extra)
	{
		extra = extra || {};

		var pstring = self.getCombatPrompt();
		for (var attr in self.attributes) {
			pstring = pstring.replace("%" + attr, self.attributes[attr]);
		}

		for (var data in extra) {
			pstring = pstring.replace("%" + data, extra[data]);
		}

		pstring = pstring.replace(/%[a-z_]+?/, '');
		self.write("\r\n" + pstring);
	};


	/**
	 * Not really a "load" as much as a constructor but we really need any
	 * of this stuff when we create a player, so make a separate method for it
	 * @param object data Object should have all the things a player needs. Like spinach.
	 */
	self.load = function (data)
	{
		self.name     = data.name;
		self.location = data.location;
		self.locale   = data.locale;
		self.prompt_string = data.prompt_string;
		self.password   = data.password;
		self.inventory  = data.inventory || [];
		self.equipment  = data.equipment || {};
		self.attributes = data.attributes;
		self.skills     = data.skills;
		// Activate any passive skills the player has
		for (var skill in self.skills) {
			if (Skills[self.getAttribute('class')][skill].type === 'passive') {
				self.useSkill(skill, self);
			}
		}
		self.tells = data.tells || [];
		self.told = data.told || [];

	};

	/**
	 * Save the player... who'da thunk it.
	 * @param function callback
	 */
	self.save = function (callback)
	{
		Data.savePlayer(self, callback);
	};

	/**
	 * Get attack speed of a player
	 * @return float
	 */
	self.getAttackSpeed = function ()
	{
		var weapon = self.getEquipped('wield', true)
		return weapon ? (weapon.getAttribute('speed') || 1) : 1;
	};

	/**
	 * Get the damage a player can do
	 * @return int
	 */
	self.getDamage = function ()
	{
		var weapon = self.getEquipped('wield', true)
		var base = [1, 20];
		var damage = weapon ?
			(weapon.getAttribute('damage') ?
				weapon.getAttribute('damage').split('-').map(function (i) { return parseInt(i, 10); })
				: base
			)
			: base;
		return {min: damage[0], max: damage[1]};
	};

	/**
	 * Turn the player into a JSON string for storage
	 * @return string
	 */
	self.stringify = function ()
	{
		var inv = [];
		self.getInventory().forEach(function (item) {
			inv.push(item.flatten());
		});

		return JSON.stringify({
			name: self.name,
			description: self.description,
			location: self.location,
			locale: self.locale,
			prompt_string: self.prompt_string,
			combat_prompt: self.combat_prompt,
			password: self.password,
			inventory: inv,
			equipment: self.equipment,
			attributes: self.attributes,
			skills: self.skills,
			tells: self.tells,
			told: self.told
		});
	};

	/**
	 * Players will have some defined events so load them on creation
	 */
	self.init = function ()
	{
		Data.loadListeners({script: "player.js"}, l10n_dir, npcs_scripts_dir, self);
	};

	/**
	 * Helper to activate skills
	 * @param string skill
	 */
	self.useSkill = function (skill/*, args... */)
	{
		if (self.isInCombat()){
			var notCombatUsable = self.notCombatUsable(skill);
			if ( notCombatUsable ) return notCombatUsable(self);
		}

        if (self.getCooldown(skill)) return true;

		Skills[self.getAttribute('class')][skill].activate.apply(null, [].slice.call(arguments).slice(1));

        self.setCooldown(skill);
	};

	self.init();
};
util.inherits(Player, events.EventEmitter);

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;
