# Mozilla India Developer Leaderboard

How awesome are you amongst your peers? Find out using this leaderboard.

## How does it work?

Leaderboard has a [backend](https://github.com/MozillaIndia/leaderchalk) & a frontend (`this` being the frontend)

### The Backend

The following is run as a daily cron-job to fetch the data to be used by the frontend. This makes the data non-realtime; however, that saves us from making truck-load of BZ queries from each client.

* We ask the list of [Mozillians](http://mozillians.org) from India
* We use their emails to query [BMO](http://bugzilla.mozilla.org)
* We get the list of Mozillians with Assigned bugs
* We check for how many bugs they've fixed with patches
* We save the list as `stats.json`, to be consumed by the frontend

### The frontend

The frontend is really a simpleton. It only asks for the JSON provided by the backend & formats it in a way that gives us a better understanding of the developer-contribution metrics.
