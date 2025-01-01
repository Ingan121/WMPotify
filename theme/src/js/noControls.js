// From https://github.com/ohitstom/spicetify-extensions/tree/main/noControls
export function setControlHeight(height) {
    // Function to check and apply the titlebar
	const checkAndApplyTitlebar = API => {
		if (API) {
			if (API._updateUiClient?.updateTitlebarHeight) {
				API._updateUiClient.updateTitlebarHeight({ height: height || 1 });
			}

			if (API._updateUiClient?.setButtonsVisibility && (!height || height <= 1)) {
				API._updateUiClient.setButtonsVisibility(false);
			}

			window.addEventListener("beforeunload", () => {
				if (API._updateUiClient?.setButtonsVisibility) {
					API._updateUiClient.setButtonsVisibility({ showButtons: true });
				}
			});
		}

		Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
			type: "update_titlebar",
			height: height ? height + "px" : "1px",
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
}