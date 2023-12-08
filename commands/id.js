const { SlashCommandBuilder } = require("discord.js");

///TODO: figure out subcommands in their own files
const data = new SlashCommandBuilder()
	.setName("id")
	.setDescription("Get raid lock statistics of your characters")
	.addSubcommand((subcommand) =>
		subcommand
			.setName("all")
			.setDescription("all of your characters from the database")
			.addStringOption((option) =>
				option
					.setName("raid")
					.setDescription("the raid you want lockout status for")
					.addChoices(
						{ name: "Terrace of Endless Spring", value: "toes" },
						{ name: "Heart of Fear", value: "hof" },
						{ name: "Mogu'shan Vaults", value: "msv" }
					)
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("position")
					.setDescription("raid position")
					.addChoices(
						{ name: "🛡️ TANK 🛡️", value: "tank" },
						{ name: "💊 HEAL 💊", value: "heal" },
						{ name: "💀 DPS 💀", value: "dps" },
						{ name: "🔪 OFFTANK 🛡️", value: "offtank" },
						{ name: "⚔️ MDPS ⚔️", value: "mdps" },
						{ name: "🎯 RDPS 🎯", value: "rdps" }
					)
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("class")
					.setDescription("character class")
					.addChoices(
						{ name: "⚔️ Warrior ⚔️", value: "1" },
						{ name: "😇 Paladin 😇", value: "2" },
						{ name: "🏹 Hunter 🏹", value: "3" },
						{ name: "🗡️ Rogue 🗡️", value: "4" },
						{ name: "⛪ Priest ⛪", value: "5" },
						{ name: "🩸 Death Knight 🩸", value: "6" },
						{ name: "⚡ Shaman ⚡", value: "7" },
						{ name: "🎲 Mage 🎲", value: "8" },
						{ name: "👿 Warlock 👿", value: "9" },
						{ name: "🐻 Druid 🐻", value: "11" }
					)
					.setRequired(false)
			)
			.addBooleanOption((option) =>
				option
					.setName("freeonly")
					.setDescription("whether or not to show only characters with free id")
					.setRequired(false)
			)
			.addBooleanOption((option) =>
				option
					.setName("public")
					.setDescription(
						"whether or not you want to make the output publicly visible"
					)
					.setRequired(false)
			)
			.addUserOption((option) =>
				option
					.setName("userid")
					.setDescription("the user you want bosskills from")
					.setRequired(false)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("character")
			.setDescription("single character")
			.addStringOption((option) =>
				option
					.setName("raid")
					.setDescription("the raid you want lockout status for")
					.addChoices(
						{ name: "Terrace of Endless Spring", value: "toes" },
						{ name: "Heart of Fear", value: "hof" },
						{ name: "Mogu'shan Vaults", value: "msv" }
					)
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("character")
					.setDescription("your character name")
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("character1")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character2")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character3")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character4")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character5")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character6")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character7")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character8")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("character9")
					.setDescription("your character name")
					.setRequired(false)
			)
			.addBooleanOption((option) =>
				option
					.setName("public")
					.setDescription(
						"whether or not you want to make the output publicly visible"
					)
					.setRequired(false)
			)
	);

async function execute(interaction) {}
module.exports = { data, execute };
