const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
	.setName("update")
	.setDescription("Update Characters")
	.addStringOption((option) =>
		option
			.setName("character")
			.setDescription("the name of your character")
			.setRequired(false)
	);

async function execute(interaction) {}

module.exports = { data, execute };
