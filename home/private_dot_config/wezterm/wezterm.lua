-- https://alexplescan.com/posts/2024/08/10/wezterm/

local wezterm = require 'wezterm'

local config = wezterm.config_builder()

config.color_scheme = 'Monokai Pro Ristretto (Gogh)'
config.window_decorations = 'RESIZE'

return config
