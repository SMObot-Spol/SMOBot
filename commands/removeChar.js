const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
	.setName("removechar")
	.setDescription("Removes a WOW character from a database of your characters")
	.addStringOption((option) =>
		option
			.setName("character")
			.setDescription("the name of your character")
			.setRequired(true)
			.setAutocomplete(true)
	)
	.addStringOption((option) =>
		option
			.setName("character2")
			.setDescription("the name of your character")
			.setRequired(false)
			.setAutocomplete(true)
	)
	.addStringOption((option) =>
		option
			.setName("character3")
			.setDescription("the name of your character")
			.setRequired(false)
			.setAutocomplete(true)
	)
	.addStringOption((option) =>
		option
			.setName("character4")
			.setDescription("the name of your character")
			.setRequired(false)
			.setAutocomplete(true)
	)
	.addStringOption((option) =>
		option
			.setName("character5")
			.setDescription("the name of your character")
			.setRequired(false)
			.setAutocomplete(true)
	);

async function execute(interaction) {}
module.exports = { data, execute };
