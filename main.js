"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const icloud = require("apple-icloudapi");
const fs = require("fs");

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
		this.on("unload", this.onUnload.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		//Overrite two factor method to read from object not from console
		icloud.TwoFACodeRequest = this.provideTfaCode,
		icloud.icloudSettingsFile = "./abc.json";

		this.update_timer = null;
		this.update_interval = 120000;

		if (!this.config.username || !this.config.password)
			throw new Error("Missing credentials");

		this.log.info("config username: " + this.config.username);
		this.log.info("config password: " + this.config.password.substring(0, 3) + "*******");
		this.log.info("config update_interval_live: " + this.config.update_interval);

		if (!fs.existsSync(icloud.icloudSettingsFile))
		{
			fs.writeFile(icloud.icloudSettingsFile, JSON.stringify({
				"apple_id": this.config.username,
				"password": this.config.password,
				"googleApiKey": "",
				"trustToken": ""
			}, null, 4), "utf8", function(err) {
				if (err) throw err;
			});
		}

		if (this.config.update_interval > 0)
			this.update_interval = this.config.update_interval;

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

		// this.update_timer = setInterval(() => {
		// 	this.doActions();
		// }, this.update_interval);

		// this.doActions();
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if (this.update_timer)
				clearInterval(this.update_timer);

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	async onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			if (id == "icloud_devices.0.tfacode") {
				icloud.tfacode = state.val;
				state.ack = true;
				await this.setStateAsync("icloud_devices.0.tfacode", "", true);
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	async provideTfaCode(callback) {

		icloud.tfacode = "";
		let trialcount = 0;
		const timer = ms => new Promise(res => setTimeout(res, ms));

		while (!icloud.tfacode && trialcount < 60)
		{
			trialcount++;
			await timer(10000);
		}

		const options = {
			url: "https://idmsa.apple.com/appleauth/auth/verify/trusteddevice/securitycode",
			headers: {
				"Content-Type": "application/json",
				"Referer": "https://idmsa.apple.com/",
				"scnt": icloud.AccountHeaders["scnt"],
				"X-Apple-ID-Session-Id": icloud.AccountHeaders["X-Apple-ID-Session-Id"],
				"X-Apple-Widget-Key": icloud.AccountHeaders["X-Apple-Widget-Key"],
			},
			json: {
				"securityCode": {
					"code": icloud.tfacode
				}
			}
		};

		icloud.iRequest.post(options, function(error, response) {
			icloud.AccountHeaders["X-Apple-Session-Token"] = response.headers["x-apple-session-token"];

			if (response.statusCode == 400) {
				return callback("Login error | Invalid 2FA Code");
			}

			if (!response || response.statusCode != 204) {
				return callback("Login error | Unable to verify 2FA code");
			}

			if (response.headers["x-apple-session-token"] == null) {
				return callback("Login error | Something went wrong with 2FA verification");
			}

			return callback(true);
		});
	}

	async doActions() {
		const instance = this;
		try {
			icloud.getDevices(function(err, devices) {
				if (err) return console.error(err);

				if (devices && devices.length > 0) {
					devices.forEach(async element => {

						instance.log.debug(element);

						await instance.setObjectNotExistsAsync(element.id + ".id", {
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
						await instance.setStateAsync(element.id + ".id", element.id, true);

						await instance.setObjectNotExistsAsync(element.id + ".modelDisplayName", {
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
						await instance.setStateAsync(element.id + ".modelDisplayName", element.modelDisplayName, true);

						await instance.setObjectNotExistsAsync(element.id + ".name", {
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
						await instance.setStateAsync(element.id + ".name", element.name, true);

						await instance.setObjectNotExistsAsync(element.id + ".deviceModel", {
							type: "state",
							common: {
								name: "deviceModel",
								type: "string",
								role: "text",
								read: true,
								write: false,
							},
							native: {},
						});
						await instance.setStateAsync(element.id + ".deviceModel", element.deviceModel, true);

						await instance.setObjectNotExistsAsync(element.id + ".batteryLevel", {
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
						await instance.setStateAsync(element.id + ".batteryLevel", Math.round(element.batteryLevel * 100), true);

						await instance.setObjectNotExistsAsync(element.id + ".location.latitude", {
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
							await instance.setStateAsync(element.id + ".location.latitude", element.location.latitude, true);

						await instance.setObjectNotExistsAsync(element.id + ".location.longitude", {
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
							await instance.setStateAsync(element.id + ".location.longitude", element.location.longitude, true);

						await instance.setObjectNotExistsAsync(element.id + ".location.timestamp", {
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
							await instance.setStateAsync(element.id + ".location.timestamp", element.location.timeStamp, true);
					});
				}
			});
		}
		catch(e) {
			this.log.warn(JSON.stringify(e));
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

