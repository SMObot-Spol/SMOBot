class CollectorManager {
	/**
	 * @type { Map< import("discord.js").User , import("discord.js").InteractionCollector > }
	 */
	collectorMap;
	constructor() {
		this.collectorMap = new Map();
	}
	/**
	 *
	 * @param {import("discord.js").User} key
	 * @param {import("discord.js").InteractionCollector} val
	 */
	set(key, val) {
		if (this.has(key)) {
			console.warn("Collector manager: setting duplicate key", key);
		}
		return this.collectorMap.set(key, val);
	}
	/**
	 *
	 * @param {import("discord.js").User} key
	 */
	has(key) {
		return this.collectorMap.has(key);
	}
	/**
	 *
	 * @param {import("discord.js").User} key
	 */
	get(key) {
		return this.collectorMap.get(key);
	}
	/**
	 *
	 * @param {import("discord.js").User} key
	 */
	delete(key) {
		if (!this.has(key)) {
			console.warn("Collector manager: removing nonexistent key", key);
		}
		return this.collectorMap.delete(key);
	}

	/**
	 *
	 * @param {import("discord.js").User} key
	 */
	stopAndDelete(key) {
		if (!this.has(key)) return;

		this.stop(key);
		this.delete(key);
	}
	/**
	 *
	 * @param {import("discord.js").User} key
	 */
	stop(key) {
		if (!this.has(key)) {
			console.warn("Collector manager: stopping nonexistent key", key);
		}

		this.get(key)?.stop();
	}
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @param {import("discord.js").CollectorFilter<[import("discord.js").MessageComponentInteraction]>} filter
	 * @param {import("discord.js").User} key
	 * @param {number} time
	 * @returns
	 */
	create(interaction, filter, key = interaction.user, time = 300000) {
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time,
		});
		this.set(key, collector);
		return collector;
	}
}

module.exports = new CollectorManager();
