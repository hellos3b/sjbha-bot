# @hellos3b/sjbha

## Requirements

1. [pnpm](https://pnpm.io/), an improved version of npm
1. [Docker](https://www.docker.com/), used for a local database

## Development

Need to fill out a `.env` file. You can use the `.env.example` as an example

```sh
pnpm dev
```

The first time you run it may take some time to download all the packages, but afterwards the layer should be cached.

## Contributing

I'm totally open to pull requests! I have a dev server setup and can provide a `.env` so you can get the bot running locally.

PR's should come with an update to [CHANGELOG.md](./CHANGELOG.md)

## Publishing

When ready to update the bot, run thes commands

```sh
# 1. Uptick the version numbers
pnpm uptick <major|minor|patch>

# 2. Set docker context to the host you want to deploy to
$env:DOCKER_CONTEXT="s3bby"

# 3. Deploy the app 
pnpm deploy
```

## Legacy Branch

The bot has been around for a while, and yes there are two versions of it running. The original version was created in javascript, and because of that it's kind of a pain to work in it.

So partial work was done to move some of the more intricate commands over to Typescript / Rescript. But there's still work to be done

## Why is half this repo in Typescript and half in Rescript?

I'm in the process of converting it to rescript, but it takes some time and often I'm too busy.

This is also just a fun side hobby project. I often use it to practice some patterns or try new things
