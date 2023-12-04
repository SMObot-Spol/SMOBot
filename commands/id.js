const { SlashCommandBuilder } = require("@discordjs/builders");

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
					.addChoice("Terrace of Endless Spring", "toes")
					.addChoice("Heart of Fear", "hof")
					.addChoice("Mogu'shan Vaults", "msv")
					.setRequired(true)
			)
			.addStringOption((option) =>
				option
					.setName("position")
					.setDescription("raid position")
					.addChoice("🛡️ TANK 🛡️", "tank")
					.addChoice("💊 HEAL 💊", "heal")
					.addChoice("💀 DPS 💀", "dps")
					.addChoice("🔪 OFFTANK 🛡️", "offtank")
					.addChoice("⚔️ MDPS ⚔️", "mdps")
					.addChoice("🎯 RDPS 🎯", "rdps")
					.setRequired(false)
			)
			.addStringOption((option) =>
				option
					.setName("class")
					.setDescription("character class")
					.addChoice("⚔️ Warrior ⚔️", "1")
					.addChoice("😇 Paladin 😇", "2")
					.addChoice("🏹 Hunter 🏹", "3")
					.addChoice("🗡️ Rogue 🗡️", "4")
					.addChoice("⛪ Priest ⛪", "5")
					.addChoice("🩸 Death Knight 🩸", "6")
					.addChoice("⚡ Shaman ⚡", "7")
					.addChoice("🎲 Mage 🎲", "8")
					.addChoice("👿 Warlock 👿", "9")
					.addChoice("🐻 Druid 🐻", "11")
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
					.addChoice("Terrace of Endless Spring", "toes")
					.addChoice("Heart of Fear", "hof")
					.addChoice("Mogu'shan Vaults", "msv")
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
