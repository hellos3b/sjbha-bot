# Unreleased

### 🐛 Bug Fix
   * define: disabled the old `!define` command from the legacy bot
   * meetup: Reinitialize #meetups-directory messages if ids in db become corrupt

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