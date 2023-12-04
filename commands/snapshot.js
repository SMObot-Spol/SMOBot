const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
	.setName("snapshot")
	.setDescription("Snapshots your currently equipped gear")
	.addStringOption((option) =>
		option
			.setName("character")
			.setDescription("the name of your character")
			.setRequired(true)
	);

async function execute(interaction) {}

module.exports = { data, execute };
