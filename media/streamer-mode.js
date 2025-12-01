// @ts-check

// This script is run within the webview itself
(() => {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    function handleOpen() {
        vscode.postMessage({ type: 'open' });
    }

    function handleClose() {
        vscode.postMessage({ type: 'close' });
    }

    const openButton = document.querySelector('.open-button');
    const closeButton = document.querySelector('.close-button');

    openButton?.addEventListener('click', handleOpen);
    closeButton?.addEventListener('click', handleClose);
})();
