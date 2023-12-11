class RussianManager {
	/**
	 * @type {Map<string,boolean[] | undefined>}
	 */
	#serverMagazineMap = new Map();
	/**
	 * @type {Map<string,Map<string,number> | undefined>}
	 * @returns {[string,number][]}
	 */
	#serverDeathMap = new Map();
	async getKills(serverId) {
		this.#pruneDead(serverId);
		return Array.from(this.#serverDeathMap.get(serverId)?.entries() ?? []);
	}
	#pruneDead(serverId) {
		if (!this.#serverDeathMap.has(serverId)) return;
		this.#serverDeathMap.get(serverId).forEach((respawn, uid) => {
			if (respawn <= Date.now()) {
				this.#serverDeathMap.delete(uid);
			}
		});
	}
	async pullTrigger(serverId, uid) {
		if (!this.#serverDeathMap.has(serverId)) {
			this.#serverDeathMap.set(serverId, new Map());
		}
		if (
			!this.#serverMagazineMap.has(serverId) ||
			this.#serverMagazineMap.get(serverId)?.length === 0
		) {
			this.#reload(serverId);
		}
		const deathMap = this.#serverDeathMap.get(serverId);
		if (deathMap.has(uid)) {
			if (deathMap.get(uid) > Date.now()) {
				const err = new Error();
				err.name = "DED_ERR";
				err.message = deathMap.get(uid);
				throw err;
			}
			deathMap.delete(uid);
		}
		const mag = this.#serverMagazineMap.get(serverId);
		const res = mag.pop();
		if (res) {
			deathMap.set(uid, Date.now() + 1000 * 60 * 5);
		}
		if (res || mag.length === 0) {
			this.#reload(serverId);
		}
		return res;
	}
	#reload(serverId) {
		const magazine = new Array(6).fill(false);
		magazine[Math.floor(Math.random() * magazine.length)] = true;
		this.#serverMagazineMap.set(serverId, magazine);
	}
}
module.exports = new RussianManager();
