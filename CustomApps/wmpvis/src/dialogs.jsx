'use strict';

import React from "react";
import Strings from "./strings";

export function confirmModal(title = "WMPotify", message, confirmText = Strings['UI_OK'], cancelText = Strings['UI_CANCEL']) {
    return new Promise((resolve, reject) => {
        const Modal = () => {
            const handleOk = () => {
                Spicetify.PopupModal.hide();
                resolve(true);
            };

            const handleCancel = () => {
                Spicetify.PopupModal.hide();
                resolve(false);
            };

            React.useEffect(() => {
                const observer = new MutationObserver(() => {
                    if (!document.contains(document.getElementById("wmpotify-confirm-modal"))) {
                        observer.disconnect();
                        resolve(false);
                    }
                });
                observer.observe(document.body, { childList: true });
                return () => observer.disconnect();
            }, []);

            return (
                <>
                    <style>
                        {`
                        .wmpotify-aero {
                            color: black;
                        }

                        button.wmpotify-aero {
                            min-height: 23px;
                            min-width: 75px;
                            padding: 0 12px;
                            text-align: center;
                        }
                        `}
                    </style>
                    <div id="wmpotify-prompt-modal">
                        <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: "8px",
                                marginBottom: "5px",
                                gap: "6px",
                            }}
                        >
                            <button className="wmpotify-aero" onClick={handleOk}>
                                {confirmText}
                            </button>
                            <button className="wmpotify-aero" onClick={handleCancel}>
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </>
            );
        };

        Spicetify.PopupModal.display({
            title: title,
            content: <Modal />,
        });
    });
}

export function promptModal(title = "WMPotify", message, text, hint) {
    return new Promise((resolve, reject) => {
        const Modal = () => {
            const [inputValue, setInputValue] = React.useState(text || "");

            const handleOk = () => {
                Spicetify.PopupModal.hide();
                resolve(inputValue);
            };

            const handleCancel = () => {
                Spicetify.PopupModal.hide();
                resolve(null);
            };

            const handleKeyDown = (event) => {
                if (event.key === "Enter") {
                    handleOk();
                } else if (event.key === "Escape") {
                    handleCancel();
                }
            };

            React.useEffect(() => {
                const observer = new MutationObserver(() => {
                    if (!document.contains(document.getElementById("wmpotify-prompt-modal"))) {
                        observer.disconnect();
                        resolve(null);
                    }
                });
                observer.observe(document.body, { childList: true });
                return () => observer.disconnect();
            }, []);

            return (
                <>
                    <style>
                        {`
                        .wmpotify-aero {
                            color: black;
                        }

                        button.wmpotify-aero {
                            min-height: 23px;
                            min-width: 75px;
                            padding: 0 12px;
                            text-align: center;
                        }
                        `}
                    </style>
                    <div id="wmpotify-prompt-modal">
                        <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
                        <input
                            className="wmpotify-aero"
                            type="text"
                            value={inputValue}
                            placeholder={hint}
                            style={{ width: "100%" }}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: "8px",
                                marginBottom: "5px",
                                gap: "6px",
                            }}
                        >
                            <button className="wmpotify-aero" onClick={handleOk}>
                                {Strings["UI_OK"]}
                            </button>
                            <button className="wmpotify-aero" onClick={handleCancel}>
                                {Strings["UI_CANCEL"]}
                            </button>
                        </div>
                    </div>
                </>
            );
        };

        Spicetify.PopupModal.display({
            title: title,
            content: <Modal />,
        });
    });
}