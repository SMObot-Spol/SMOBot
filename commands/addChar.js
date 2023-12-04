const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
	.setName("addchar")
	.setDescription("Adds WOW character into a database of your characters")
	.addStringOption((option) =>
		option
			.setName("character")
			.setDescription("the name of your character")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("character2")
			.setDescription("the name of your character")
			.setRequired(false)
	)
	.addStringOption((option) =>
		option
			.setName("character3")
			.setDescription("the name of your character")
			.setRequired(false)
	)
	.addStringOption((option) =>
		option
			.setName("character4")
			.setDescription("the name of your character")
			.setRequired(false)
	)
	.addStringOption((option) =>
		option
			.setName("character5")
			.setDescription("the name of your character")
			.setRequired(false)
	)
	.addUserOption((option) =>
		option
			.setName("userid")
			.setDescription("the user you want to add character to")
			.setRequired(false)
	);

async function execute(interaction) {}

module.exports = { data, execute };
