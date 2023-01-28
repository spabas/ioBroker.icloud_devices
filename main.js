"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const iCloud = require("apple-icloud");
const sessionPath = "icloud-session.json";

// Load your modules here, e.g.:
// const fs = require("fs");

class IcloudDevices extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "icloud_devices",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here
		const instance = this;
		this.update_timer = null;
		let update_interval = 120000;

		if (!this.config.username || !this.config.password)
			throw new Error("Missing credentials");

		this.log.info("config username: " + this.config.username);
		this.log.info("config password: " + this.config.password.substring(0, 3) + "*******");
		this.log.info("config update_interval_live: " + this.config.update_interval);

		if (this.config.update_interval > 0)
			update_interval = this.config.update_interval;

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync("tfacode", {
			type: "state",
			common: {
				name: "tfacode",
				type: "string",
				role: "text",
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("tfacode");

		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		/* await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 }); */

		// examples for the checkPassword/checkGroup functions
		/* let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result); */

		this.myCloud = new iCloud(sessionPath, this.config.username, this.config.password);

		this.myCloud.on("ready", async function() {
			instance.log.info("ready");
			const isAutheticated = await instance.readyHandlerTwoFactor();
			if (isAutheticated) {
				instance.myCloud.saveSession();
				instance.log.info("receive initial data");
				await instance.doActions();

				instance.update_timer = instance.setInterval(async function() {
					instance.log.info("updating data");
					await instance.doActions();
				}, update_interval);
			}
		});

		this.myCloud.on("err", function(err) {
			instance.log.info(JSON.stringify(err));
		});

		this.myCloud.on("sessionUpdate", function() {
			instance.log.info("config saved");
			instance.myCloud.saveSession();
		});
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if (this.update_timer)
				this.clearInterval(this.update_timer);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			if (id == "icloud_devices.0.tfacode") {
				this.myCloud.securityCode = state.val;
				state.ack = true;
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

	async doActions() {
		try {
			//console.log("Action");
			const devices = await this.myCloud.FindMe.get();
			//console.log(JSON.stringify(devices));

			if (devices.content && devices.content.length > 0) {
				devices.content.forEach(async element => {
					await this.setObjectNotExistsAsync(element.id + ".id", {
						type: "state",
						common: {
							name: "id",
							type: "string",
							role: "text",
							read: true,
							write: true,
						},
						native: {},
					});
					await this.setStateAsync(element.id + ".id", element.id, true);

					await this.setObjectNotExistsAsync(element.id + ".modelDisplayName", {
						type: "state",
						common: {
							name: "modelDisplayName",
							type: "string",
							role: "text",
							read: true,
							write: false,
						},
						native: {},
					});
					await this.setStateAsync(element.id + ".modelDisplayName", element.modelDisplayName, true);

					await this.setObjectNotExistsAsync(element.id + ".name", {
						type: "state",
						common: {
							name: "name",
							type: "string",
							role: "text",
							read: true,
							write: false,
						},
						native: {},
					});
					await this.setStateAsync(element.id + ".name", element.name, true);

					await this.setObjectNotExistsAsync(element.id + ".rawDeviceModel", {
						type: "state",
						common: {
							name: "rawDeviceModel",
							type: "string",
							role: "text",
							read: true,
							write: false,
						},
						native: {},
					});
					await this.setStateAsync(element.id + ".rawDeviceModel", element.rawDeviceModel, true);

					await this.setObjectNotExistsAsync(element.id + ".batteryLevel", {
						type: "state",
						common: {
							name: "batteryLevel",
							type: "number",
							role: "value.battery",
							read: true,
							write: false,
							unit: "%"
						},
						native: {},
					});
					await this.setStateAsync(element.id + ".batteryLevel", Math.round(element.batteryLevel * 100), true);

					await this.setObjectNotExistsAsync(element.id + ".location.latitude", {
						type: "state",
						common: {
							name: "latitude",
							type: "number",
							role: "value.gps.latitude",
							read: true,
							write: false,
						},
						native: {},
					});
					if (element.location)
						await this.setStateAsync(element.id + ".location.latitude", element.location.latitude, true);

					await this.setObjectNotExistsAsync(element.id + ".location.longitude", {
						type: "state",
						common: {
							name: "longitude",
							type: "number",
							role: "value.gps.longitude",
							read: true,
							write: false,
						},
						native: {},
					});
					if (element.location)
						await this.setStateAsync(element.id + ".location.longitude", element.location.longitude, true);

					await this.setObjectNotExistsAsync(element.id + ".location.timestamp", {
						type: "state",
						common: {
							name: "timestamp",
							type: "number",
							role: "date",
							read: true,
							write: false,
						},
						native: {},
					});
					if (element.location)
						await this.setStateAsync(element.id + ".location.timestamp", element.location.timeStamp, true);
				});
			}
		}
		catch(e) {
			console.log(e);
		}
	}

	async readyHandlerTwoFactor() {

		if (this.myCloud.twoFactorAuthenticationIsRequired) {
			console.log("Two factor authentication code required!");
			return true;
		}
		else {
			console.log("You are logged in successfully!");
			return true;
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new IcloudDevices(options);
} else {
	// otherwise start the instance directly
	new IcloudDevices();
}

