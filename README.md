Readme WIP



## Versioning

First, uptick the backed 

```sh
cd backend
npm version <patch|minor|major>

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
cd ./backend
DOCKER_HOST="ssh://username@host" docker compose build
DOCKER_HOST="ssh://username@host" docker compose up -d
```

## Deploy Frontend

Frontend uses github pages and is using an npm library to make everything easy

```sh
cd ./frontend
npm run deploy
```