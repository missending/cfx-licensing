-- cfx-licensing Lua SDK
-- Usage:
--   local license = require('license')
--   if not license.verify() then
--     error('invalid license')
--   end

local M = {}

local ENDPOINT = GetConvar('license_endpoint', 'https://your-worker.workers.dev')
local KEY      = GetConvar('license_key',      '')

local function hwid()
  -- FiveM gives us the player's hardware token at script boot.
  return GetPlayerToken(0)
end

local function post(path, body, cb)
  PerformHttpRequest(ENDPOINT .. path, function(code, text)
    cb(code, text and json.decode(text) or nil)
  end, 'POST', json.encode(body), { ['Content-Type'] = 'application/json' })
end

function M.verify(cb)
  if KEY == '' then
    if cb then cb(false, 'no_key') end
    return false
  end

  post('/verify', { key = KEY, hwid = hwid() }, function(code, body)
    local ok = code == 200 and body and body.ok == true
    if cb then cb(ok, body and body.error or nil) end
  end)

  return true
end

return M
