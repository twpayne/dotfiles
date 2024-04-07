hs.grid.setGrid('12x12') -- allows us to place on quarters, thirds and halves
hs.window.animationDuration = 0 -- disable animations

local grid = {
  rightTopHalf = '6,0 6x6',
  rightBottomHalf = '6,6 6x6',

  rightTopThird = '6,0 6x4',
  rightMiddleThird = '6,4 6x4',
  rightBottomThird = '6,8 6x4',

  rightFirstQuarter = '6,0 6x3',
  rightSecondQuarter = '6,3 6x3',
  rightThirdQuarter = '6,6 6x3',
  rightFourthQuarter = '6,9 6x3',

  leftThird = '0,0 4x12',
  leftTwoThirds = '0,0 8x12',
  middleThird = '4,0 4x12',
  rightThird = '8,0 4x12',
  rightTwoThirds = '4,0 8x12',

  leftThirdTopHalf = '0,0 4x6',
  leftTwoThirdsTopHalf = '0,0 8x6',
  middleThirdTopHalf = '4,0 4x6',
  rightThirdTopHalf = '8,0 4x6',
  rightTwoThirdsTopHalf = '4,0 8x6',

  leftThirdBottomHalf = '0,6 4x6',
  leftTwoThirdsBottomHalf = '0,6 8x6',
  middleThirdBottomHalf = '4,6 4x6',
  rightThirdBottomHalf = '8,6 4x6',
  rightTwoThirdsBottomHalf = '4,6 8x6',

  leftQuarter = '0,0 3x12',
  middleHalf = '3,0 6x12',
  rightQuarter = '9,0 3x12',

  bottomHalf = '0,6 12x6',
  leftHalf = '0,0 6x12',
  rightHalf = '6,0 6x12',
  topHalf = '0,0 12x6',

  fullScreen = '0,0 12x12',
  tenTwelfes = '1,1 10x10',

  leftTopHalf = '0,0 6x6',
  leftBottomHalf = '0,6 6x6',

  leftTopThird = '0,0 6x4',
  leftMiddleThird = '0,4 6x4',
  leftBottomThird = '0,8 6x4',

  leftFirstQuarter = '0,0 6x3',
  leftSecondQuarter = '0,3 6x3',
  leftThirdQuarter = '0,6 6x3',
  leftFourthQuarter = '0,9 6x3',
}

--
-- Key bindings.
--

function moveFrontmostWindow(where)
  return function()
    local window = hs.window.frontmostWindow()
    local screen = window:screen()
    hs.grid.set(window, where, screen)
  end
end

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

function moveFocusedWindowToScreen()
  local window = hs.window.focusedWindow()
  local screen = window:screen()
  window:move(window:frame():toUnitRect(screen:frame()), screen:next(), true, 0)
end

local bindings = {
  [{'alt', 'ctrl'}] = {
    [1] = moveFrontmostWindow(grid.rightTopHalf),
    [2] = moveFrontmostWindow(grid.rightBottomHalf),

    [3] = moveFrontmostWindow(grid.rightTopThird),
    [4] = moveFrontmostWindow(grid.rightMiddleThird),
    [5] = moveFrontmostWindow(grid.rightBottomThird),

    [6] = moveFrontmostWindow(grid.rightFirstQuarter),
    [7] = moveFrontmostWindow(grid.rightSecondQuarter),
    [8] = moveFrontmostWindow(grid.rightThirdQuarter),
    [9] = moveFrontmostWindow(grid.rightFourthQuarter),

    q = moveFrontmostWindow(grid.leftThirdTopHalf),
    w = moveFrontmostWindow(grid.leftTwoThirdsTopHalf),
    e = moveFrontmostWindow(grid.middleThirdTopHalf),
    r = moveFrontmostWindow(grid.rightTwoThirdsTopHalf),
    t = moveFrontmostWindow(grid.rightThirdTopHalf),

    a = moveFrontmostWindow(grid.leftThird),
    s = moveFrontmostWindow(grid.leftTwoThirds),
    d = moveFrontmostWindow(grid.middleThird),
    f = moveFrontmostWindow(grid.rightTwoThirds),
    g = moveFrontmostWindow(grid.rightThird),

    z = moveFrontmostWindow(grid.leftThirdBottomHalf),
    x = moveFrontmostWindow(grid.leftTwoThirdsBottomHalf),
    c = moveFrontmostWindow(grid.middleThirdBottomHalf),
    v = moveFrontmostWindow(grid.rightTwoThirdsBottomHalf),
    b = moveFrontmostWindow(grid.rightThirdBottomHalf),

    y = moveFrontmostWindow(grid.leftQuarter),
    u = moveFrontmostWindow(grid.middleHalf),
    i = moveFrontmostWindow(grid.rightQuarter),

    h = moveFrontmostWindow(grid.leftHalf),
    j = moveFrontmostWindow(grid.bottomHalf),
    k = moveFrontmostWindow(grid.topHalf),
    l = moveFrontmostWindow(grid.rightHalf),

    ['space'] = moveFrontmostWindow(grid.tenTwelfes),
    ['return'] = moveFrontmostWindow(grid.fullScreen),
    ['\\'] = moveFocusedWindowToScreen,
  },

  [{'alt', 'cmd', 'ctrl'}] = {
    [1] = moveFrontmostWindow(grid.leftTopHalf),
    [2] = moveFrontmostWindow(grid.leftBottomHalf),

    [3] = moveFrontmostWindow(grid.leftTopThird),
    [4] = moveFrontmostWindow(grid.leftMiddleThird),
    [5] = moveFrontmostWindow(grid.leftBottomThird),

    [7] = moveFrontmostWindow(grid.leftSecondQuarter),
    [8] = moveFrontmostWindow(grid.leftThirdQuarter),
    [9] = moveFrontmostWindow(grid.leftFourthQuarter),
  },

  [{'alt', 'cmd', 'ctrl', 'shift'}] = {
    c = launchOrFocus('Google Chrome'),
    f = launchOrFocus('Finder'),
    i = launchOrFocus('Visual Studio Code'),
    l = launchOrFocus('Telegram'),
    j = runCommand("/Users/twp/bin/forge-gui"),
    s = launchOrFocus('Slack'),
    t = launchOrFocus('iTerm'),
    w = launchOrFocus('WhatsApp'),
    y = launchOrFocus('System Preferences'),
    z = launchOrFocus('zoom.us'),
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
