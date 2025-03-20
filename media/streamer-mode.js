// @ts-check

// This script is run within the webview itself
(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-undef
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
