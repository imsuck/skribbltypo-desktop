import { app, BrowserWindow, Menu, MenuItem } from "electron/main";
import * as path from "path";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
  });

  mainWindow.loadURL("https://skribbl.io/");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
  });
}

let mainMenu = new Menu;

if (process.platform === 'darwin') {
  const appMenu = new MenuItem({ role: 'appMenu' })
  mainMenu.append(appMenu)
}

const submenu = Menu.buildFromTemplate([
  {
    label: "Open DevTools",
    click: () => {
      if (mainWindow) {
        mainWindow.webContents.openDevTools();
      }
    },
    accelerator: "CmdOrCtrl+Shift+I",
  },
]);
mainMenu.append(new MenuItem({ label: "FXClient", submenu }))

Menu.setApplicationMenu(mainMenu)

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
