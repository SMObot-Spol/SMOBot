class RaiRoomManager {
	constructor() {
		/**
		 * @type {import("discord.js").GuildBasedChannel[]}
		 */
		this.raidRoomMap = [];
	}
	#sortFn(a, b) {
		var nameA = a.guild.name.toUpperCase(); // ignore upper and lowercase
		var nameB = b.guild.name.toUpperCase(); // ignore upper and lowercase
		if (nameA < nameB) {
			return -1;
		}
		if (nameA > nameB) {
			return 1;
		}

		return 0;
	}
	sort() {
		this.raidRoomMap.sort(this.#sortFn);
	}
	addRoom(room) {
		this.raidRoomMap.push(room);
		this.sort();
	}
	removeRoom(room, findFn = (element) => element == room) {
		let indx = this.raidRoomMap.findIndex(findFn);
		if (indx != undefined && indx > -1) {
			this.raidRoomMap.splice(indx, 1);
		}
		this.sort();
	}
}

module.exports = new RaiRoomManager();
