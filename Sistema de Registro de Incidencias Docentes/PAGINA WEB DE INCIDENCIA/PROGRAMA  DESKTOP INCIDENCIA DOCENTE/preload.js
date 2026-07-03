const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendSaveUrl: (url) => ipcRenderer.send('save-url', url),
    onSetUrl: (callback) => ipcRenderer.on('set-url', (event, url) => callback(url)),
    getSupportUrl: () => ipcRenderer.invoke('get-support-url'),
    openExternal: (url) => ipcRenderer.send('open-external', url),
    checkPassword: (password) => ipcRenderer.invoke('check-password', password),
    quitApp: () => ipcRenderer.send('quit-app'),
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', width, height)
});
