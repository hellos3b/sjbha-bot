# Unreleased

### 🏠 Internal
   * House keeping all unwanted modules into a `deprecating` folder to make clear which direction I want to go in

# 2.2.10

### ⭐ Enhancements
   * define: Remove button expire time bumped up to an hour instead of 10 minutes
   * define: Remove button now disappears when a post is no longer removable instead of disabling

### 🚀 Features
   * aqi: Is now located at `/aqi`
   * mod: Notes now tell everyone when a note is made in a new bot log channel

### 🏠 Internal
   * Moving away from rescript to focus onto one language
   * Simplified command handling to aid in making strong module boundaries
    
# 2.2.9

### 🚀 Features
   * meetup: Add short description to meetups-directory and include RSVP count
   * mod: Display command result publicly in admin channel

### 🐛 Bug Fix
   * define: disabled the old `!define` command from the legacy bot
   * meetup: Reinitialize #meetups-directory messages if ids in db become corrupt
   * mod: Require kick permissions for `/mod` commands

### 🏠 Internal
   * Removed any module alias imports using `@sjbha` and switched to relative directory
   * Switch to esbuild for building and use the bundle for docker file
   
# 2.2.8

### 🐛 Bug Fix
   * meetup: bot stuck in crash loop when too many people RSVP for a meetup

# 2.2.7

### 🚀 Features
   * Added command `/modnote` for logging notes on users 
   * Migrated `!echo` to a slash command that can now be used inline
   * Migrated `!define` command to a slash command with a remove button.

### 🐛 Bug Fix
   * tldr: Using `/tldr` outside of shitpost will display tldrs privately
   * meetup: Increased the amount of mentions in a meetup announcement to 80 to fit more users on one line ([#172](https://github.com/hellos3b/sjbha-bot/issues/172))
   * meetup: Fix issue where names aren't rendering on meetups when over 100 people RSVP ([#173](https://github.com/hellos3b/sjbha-bot/issues/173))

### 🏠 Internal
   * Migrated to Discord library v14, which includes support for modals
   * Merged the code from the legacy branch to main, setup commands to work at root level
   * Switched to a manually updated CHANGELOG

# 2.2.3

As of 2.2.3, Changelog was changed to a manual update. For changelog information for 2.2.6 and before, check the [Github Releases](https://github.com/hellos3b/sjbha-bot/releases) page.