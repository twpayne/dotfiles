-- https://alexplescan.com/posts/2024/08/10/wezterm/

local wezterm = require 'wezterm'

local config = wezterm.config_builder()

config.color_scheme = 'Monokai Pro Ristretto (Gogh)'
config.window_decorations = 'RESIZE'

wezterm.on('update-status', function(window)
	local SOLID_LEFT_ARROW = utf8.char(0xe0b2)

	local color_scheme = window:effective_config().resolved_palette
	local bg = color_scheme.background
	local fg = color_scheme.foreground

	window:set_right_status(wezterm.format({
		{ Background = { Color = 'none' } },
		{ Foreground = { Color = bg } },
		{ Text = SOLID_LEFT_ARROW },
		{ Background = { Color = bg } },
		{ Foreground = { Color = fg } },
		{ Text = ' ' .. wezterm.hostname() .. ' ' },
	}))
end)

return config
