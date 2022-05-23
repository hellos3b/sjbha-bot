# @hellos3b/sjbha-bot

This is the SJBHA bot. Free to fork and use

## Development

Install [pnpm](https://pnpm.io/) globally

```sh
pnpm install --frozen-lockfile
pnpm dev:re #Builds rescript files
pnpm start
```

## Deploy Bot

First, create a [Docker Context](https://docs.docker.com/engine/context/working-with-contexts/) using your ssh host as a target. Then, pretending I named my context "s3bby":

```sh
$env:DOCKER_HOST="s3bby"
docker compose build
docker compose up -d
```

## Versioning

Before deploying, uptick the version of the bot and create a release.

First, uptick the backed 

```sh
cd bot
pnpm version <patch|minor|major>

# commit with version name
git add .
git commit -m "v1.0.0"
git push origin master
```

Then head to the [Releases page](https://github.com/hellos3b/sjbha-bot/releases) 

Create a new tag with the same version name, click "Auto-generate Release notes" and Publish Release!