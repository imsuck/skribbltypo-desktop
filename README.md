# Skribbltypo Desktop

> [!Note]
> This project is pretty much entirely "AI slop".
>
> If you are on Linux, you may want to get the [desktop file](resources/desktop/skribbltypo.desktop)
> and add it to the MIME list with `xdg-mime default skribbltypo.desktop x-scheme-handler/skribbl`
> or `handlr set x-scheme-handler/skribbl skribbltypo.desktop`.

Grab the latest release [here](https://github.com/imsuck/skribbltypo-desktop/releases/latest).

## Features

- [toobeeh/skribbltypo](https://github.com/toobeeh/skribbltypo/) supported out of the box
- DiscordRPC for in-game status
- Join lobbies with `F4`, link/lobby id will be fetch from system clipboard (or manually input the id through a popup).
- `skribbl://<lobby-id>` for joining directly from browsers or Discord.

## Credits

- [kapowaz/circle-flags](https://github.com/kapowaz/circle-flags): for country flags
- _Anonymous_ for the DiscordRPC assets

## TODOs

- [ ] **Auto-Updater** with `electron-updater` for wrapper updates.
- [x] **Discord Rich Presence**: Show current game status (points, name, etc.).
- [ ] **Settings UI**: Native window (or more HTML injection) for toggling notifications and Discord-RPC.
- [ ] Don't redirect outside of skribbl, open the default browser instead.
- [ ] Fix bug when switching profiles.
