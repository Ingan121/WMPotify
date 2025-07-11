'use strict';

import Strings from '../strings';

class ControlManager {
	// From https://github.com/ohitstom/spicetify-extensions/tree/main/noControls
	constructor(controlHeight = 1) {
		this.controlHeight = controlHeight;

		if (Spicetify.Config.extensions.includes("noControls.js")) {
			Spicetify.showNotification("[WMPotify] " + Strings.getString("MAIN_MSG_ERROR_INCOMPAT_EXT", "No Controls"));
			return;
		}

		// Function to check and apply the titlebar
		const checkAndApplyTitlebar = API => {
			if (API) {
				if (API._updateUiClient?.updateTitlebarHeight) {
					API._updateUiClient.updateTitlebarHeight({ height: this.controlHeight });
				}

				if (API._updateUiClient?.setButtonsVisibility && (this.controlHeight <= 1)) {
					API._updateUiClient.setButtonsVisibility(false);
				}

				window.addEventListener("beforeunload", () => {
					if (API._updateUiClient?.setButtonsVisibility) {
						API._updateUiClient.setButtonsVisibility({ showButtons: true });
					}
				});
			}

			Spicetify.CosmosAsync?.post("sp://messages/v1/container/control", {
				type: "update_titlebar",
				height: this.controlHeight + "px",
			});
		};

		// Apply titlebar initially
		checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI); // Spotify >= 1.2.53
		checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI); // Spotify >= 1.2.51

		// Ensure the titlebar is hidden (spotify likes to change it back sometimes on loadup)
		async function enforceHeight() {
			checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
			checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
		}

		const intervalId = setInterval(enforceHeight, 100); // Every 100ms
		setTimeout(() => {
			clearInterval(intervalId); // Stop after 10 seconds <- need a better killswitch idk mainview ready or something
		}, 10000);

		// Detect fullscreen changes and apply titlebar hiding
		const handleFullscreenChange = () => {
			// When the app goes fullscreen or exits fullscreen
			checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
			checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
		};

		// Add event listener for fullscreen change
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		window.addEventListener("resize", () => {
			setTimeout(() => {
				handleFullscreenChange();
			}, 100);
		});
	}

	setControlHeight(height) {
		this.controlHeight = height || 1;
	}
};

export default ControlManager;