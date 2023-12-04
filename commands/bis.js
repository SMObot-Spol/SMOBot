const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
	.setName("bis")
	.setDescription("Find out what items you need to achiev BIS")
	.addStringOption((option) =>
		option
			.setName("character")
			.setDescription("the name of your character")
			.setRequired(true)
			.setAutocomplete(true)
	);

async function execute(interaction) {}

module.exports = { data, execute };
