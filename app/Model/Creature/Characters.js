//set up the collection for characters
Characters = new Mongo.Collection("characters");

Schemas.Character = new SimpleSchema({
	//strings
	name:         {type: String, defaultValue: "", trim: false, optional: true},
	urlName:      {type: String, defaultValue: "-", trim: false, optional: true},
	alignment:    {type: String, defaultValue: "", trim: false, optional: true},
	gender:       {type: String, defaultValue: "", trim: false, optional: true},
	race:         {type: String, defaultValue: "", trim: false, optional: true},
	picture:      {type: String, defaultValue: "", trim: true,  optional: true},
	description:  {type: String, defaultValue: "", trim: false, optional: true},
	personality:  {type: String, defaultValue: "", trim: false, optional: true},
	ideals:       {type: String, defaultValue: "", trim: false, optional: true},
	bonds:        {type: String, defaultValue: "", trim: false, optional: true},
	flaws:        {type: String, defaultValue: "", trim: false, optional: true},
	backstory:    {type: String, defaultValue: "", trim: false, optional: true},

	//mechanics
	deathSave: {type: Schemas.DeathSave},
	xp:        {type: Number, defaultValue: 0},

	//permissions
	party:   {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
	owner:   {type: String, regEx: SimpleSchema.RegEx.Id, index: 1},
	readers: {type: [String], regEx: SimpleSchema.RegEx.Id, defaultValue: [], index: 1},
	writers: {type: [String], regEx: SimpleSchema.RegEx.Id, defaultValue: [], index: 1},
	color:   {
		type: String,
		allowedValues: _.pluck(colorOptions, "key"),
		defaultValue: "q",
	},
	//TODO add per-character settings
	//how many experiences to load at a time in XP table
	"settings.experiencesInc": {type: Number, defaultValue: 20},
	//slowed down by carrying too much?
	"settings.useVariantEncumbrance": {type: Boolean, defaultValue: false},
	"settings.useStandardEncumbrance": {type: Boolean, defaultValue: true},
	//hide spellcasting
	"settings.hideSpellcasting": {type: Boolean, defaultValue: false},
	//show to anyone with link
	"settings.viewPermission": {
		type: String,
		defaultValue: "whitelist",
		allowedValues: ["whitelist", "public"],
		index: 1,
	},
	"settings.swapStatAndModifier": {type: Boolean, defaultValue: false},
	"settings.exportFeatures": {type: Boolean, defaultValue: true},
	"settings.exportAttacks": {type: Boolean, defaultValue: true},
	"settings.exportDescription": {type: Boolean, defaultValue: true},
	"settings.newUserExperience": {type: Boolean, optional: true},
});

Characters.attachSchema(Schemas.Character);

//memoize funcitons that have finds and slow loops
Characters.calculate = {
	xpLevel: function(charId){
		var xp = Characters.calculate.experience(charId);
		for (var i = 0; i < 19; i++){
			if (xp < XP_TABLE[i]){
				return i;
			}
		}
		if (xp > 355000) return 20;
		return 0;
	},
};

//clean up all data related to that character before removing it
if (Meteor.isServer){
	Characters.after.remove(function(userId, character) {
		let charId = character._id;
		Actions          .remove({charId});
		Attacks          .remove({charId});
		Attributes       .remove({charId});
		Buffs            .remove({charId});
		Classes          .remove({charId});
		CustomBuffs      .remove({charId});
		DamageMultipliers.remove({charId});
		Effects          .remove({charId});
		Experiences      .remove({charId});
		Features         .remove({charId});
		Notes            .remove({charId});
		Proficiencies    .remove({charId});
		Skills           .remove({charId});
		SpellLists       .remove({charId});
		Items            .remove({charId});
		Containers       .remove({charId});
	});
	Characters.after.update(function(userId, doc, fieldNames, modifier, options) {
		if (_.contains(fieldNames, "name")){
			var urlName = getSlug(doc.name, {maintainCase: true}) || "-";
			Characters.update(doc._id, {$set: {urlName}});
		}
	});
	Characters.before.insert(function(userId, doc) {
		doc.urlName = getSlug(doc.name, {maintainCase: true}) || "-";
		// The first character a user creates should have the new user experience
		if (!Characters.find({owner: userId}).count()){
			doc.settings.newUserExperience = true;
		}
	});
}

Characters.allow({
	insert: function(userId, doc) {
		// the user must be logged in, and the document must be owned by the user
		return (userId && doc.owner === userId);
	},
	update: function(userId, doc, fields, modifier) {
		// can only change documents you have write access to
		return doc.owner === userId ||
			_.contains(doc.writers, userId);
	},
	remove: function(userId, doc) {
		// can only remove your own documents
		return doc.owner === userId;
	},
	fetch: ["owner", "writers"],
});

Characters.deny({
	update: function(userId, docs, fields, modifier) {
		// can't change owners
		return _.contains(fields, "owner");
	}
});