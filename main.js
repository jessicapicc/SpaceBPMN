const electron = require('electron');
const app = electron.app;

const path = require('path');
const url = require('url');

const BrowserWindow = electron.BrowserWindow;


var mainWindow;

app.on('ready',function(){
    mainWindow = new BrowserWindow({width: 1080, height: 720,backgroundColor: '#2e2c29'});
    mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'dist/index.html'),
    protocol: 'file:',
    slashes: true
  }));

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
    app.exit(0)
});
