# @hellos3b/sjbha

## Prerequisites

This bot runs inside a docker container, so make sure to have [Docker installed](https://www.docker.com/)

## Development

Copy `.env.example` to a new file `.env` and fill out the necessary variables. Then, run:

```sh
pnpm dev
```

The first time you run it may take some time to download all the packages, but afterwards the layer should be cached.


## Publishing

```sh
# 1. Uptick the version numbers
pnpm release

# 2. Set docker context to the host you want to deploy to
$env:DOCKER_CONTEXT="s3bby"

# 3. Deploy the app 
pnpm deploy
```

Then head to the [Releases page](https://github.com/hellos3b/sjbha-bot/releases) 

Create a new tag with the same version name, click "Auto-generate Release notes" and Publish Release!

## Deploying

```

## Legacy Branch

The bot has been around for a while, and yes there are two versions of it running. The original version was created in javascript, and because of that it's kind of a pain to work in it.

So partial work was done to move some of the more intricate commands over to Typescript / Rescript. But there's still work to be done

## Why is half this repo in Typescript and half in Rescript?

I'm in the process of converting it to rescript, but it takes some time and often I'm too busy.

This is also just a fun side hobby project. I often use it to practice some patterns or try new things