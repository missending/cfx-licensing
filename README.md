# cfx-licensing

HWID licensing system for FiveM script sellers. Workers + D1 + Lua SDK.

Stop your scripts getting leaked. Every buyer locks to one machine (or Discord ID). Revoke in one command when they chargeback.

## Why I built this

Was tired of my scripts ending up on leak sites a week after selling them. Built this for myself, cleaned it up, open-sourced the stack.

## Features

- HWID lock per key
- Discord ID binding (one person, one license)
- Revoke / rebind / expire from a dashboard or Discord bot command
- Expiry dates (lifetime, monthly, weekly)
- Usage logs, every check-in logged with IP + country
- Lua SDK, `license.verify()` at script start, done

## How it works

```
Buyer runs your script → script sends { key, hwid } → Worker checks D1 → OK / revoked
```

If the key doesn't match, the script `error()`s out and your code never runs.

## Setup

```bash
git clone https://github.com/missending/cfx-licensing
cd cfx-licensing/worker
wrangler d1 create cfx-licensing
# paste the db id into wrangler.toml
wrangler d1 execute cfx-licensing --file=./schema.sql
wrangler deploy
```

Then in your FiveM script:

```lua
local license = require('license')
if not license.verify() then
  error('invalid license')
end
```

## Pricing

Free for personal use. Hosted managed version coming. Ping me on Discord if interested.

## Contact

- Discord: https://discord.gg/c7d2vBY52z
- Portfolio: https://tec72.cc

## License

MIT (the code. your licenses are yours)
