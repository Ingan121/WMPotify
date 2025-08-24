const script = document.createElement("script");
script.src = chrome.runtime.getURL("exposed.js");
script.dataset.extensionId = chrome.runtime.id;
document.head.appendChild(script);