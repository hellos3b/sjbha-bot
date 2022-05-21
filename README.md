Readme WIP



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

## Deploy Bot

Make sure to have Docker installed and set up ssh auth keys for the host you want to deploy to

```sh
cd ./bot
$env:DOCKER_HOST="s3bby"
docker compose build
docker compose up -d
```

## Deploy Website

The web uses github pages and is using an npm library to make everything easy

```sh
cd ./web
pnpm deploy
```