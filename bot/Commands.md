# Meetups

### Creating a meetup
Copy and paste, the date and event name are required and everything else is optional
```
!meetup 12/20 6:00pm
| (event-name-here) 
| description:
| location:
| url:
| image:
| type: (event, drinks, food, or active)
```

### Mentioning RSVPs
Sends a message that mentions the list of people who RSVP'd or Maybe'd for a meetup. Use this to notify for any changes. It will ask for which meetup to mention
```
!mention
!mention yes
!mention maybe
```

### Canceling a meetup 
*(Follow prompts)*
```
!cancel
```

### Editing a meetup 
*(Follow prompts)*
```
!edit
```

### View list of current meetups in chronological order
```
!meetups
!meetups today
!meetups week 
```

### Quick copy + paste !meetup help command
```
!help
```

# Global
### Check if the bot is alive. Should respond with a 👋
```
!ping
```

### Start a poll 
Auto adds reactions, then prints vote results after 10 minutes. 4 options max
```
!poll What time should we start? | 7:00pm | 8:00pm | 9:00pm
```
![image](https://imgur.com/iFVXnLF.png)

### "Banning" someone (prints out a joke ban reason)
```
!ban person
```

### Scooter echo
```
!scooter
```

### Swirls echo
```
!swirls
```

### Find James' new discord nickname
```
!wheres james
```


# Teams
Teams are randomly assigned, use this command to get one. You can't change it after you join
```
!team
```

*Teams don't actually mean anything*

### View current Teams
This only works in general 2
```
!teams
```

# TLDR
A running log of what's going on the server, added by users

To add a tldr
```
!tldr message that I want to save
```

to view the tldrs
```
!tldr
```

*You can only view them in General 2*

# Stocks
Have the bot upload a chart for a specific stock. Only works in #stocks channel
```
!chart AMZN
```

# Strava
Strava integration with the 5k channel. In order to work, you need to authenticate your account with the bot
```
!strava auth
```

Afterwards, whenever you record a run, it will send a message to the channel

### View strava stats
Shows how many runs, minutes, and miles you've ran in the last 4 weeks
```
!strava stats
!strava stats @user
```

### View Leaders
Will show a leaderboard for the last four weeks, sorted by time spent running
```
!strava leaders
```

### View Average
Averages out your last 4 weeks worth of runs to show average distance and pace
```
!strava avg
!strava avg @user
```

Bot coded by @s3b 👋