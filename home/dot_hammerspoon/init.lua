function launchOrFocus(app)
  return function()
    hs.application.launchOrFocus(app)
  end
end

function runCommand(command)
  return function()
    hs.task.new(command, nil):start()
  end
end

local bindings = {
  [{'alt', 'cmd', 'ctrl', 'shift'}] = {
    c = launchOrFocus('Firefox'),
    f = launchOrFocus('Finder'),
    i = launchOrFocus('Visual Studio Code'),
    j = runCommand(os.getenv('HOME') .. '/.local/bin/forge-gui'),
    o = launchOrFocus('1Password'),
    t = launchOrFocus('Ghostty'),
    y = launchOrFocus('System Preferences'),
  },
}

for modifier, keyActions in pairs(bindings) do
  for key, action in pairs(keyActions) do
    hs.hotkey.bind(modifier, tostring(key), action)
  end
end

--
-- Auto-reload config on change.
--

function reloadConfig(files)
  for _, file in pairs(files) do
    if file:sub(-4) == '.lua' then
      hs.reload()
    end
  end
end

hs.pathwatcher.new(os.getenv('HOME') .. '/.hammerspoon/', reloadConfig):start()
