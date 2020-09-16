# !fit

The fit command lets users connect their [Strava](https://www.strava.com) accounts to the bot.

After connecting, when users record a new activity through Strava, it will post it to the fitness channel

## Usage

In order to connect your account, you must first give the bot permission to access your strava account. To do that, use the auth command in the fitness channel

```
!fit auth
```

The bot will send you a link that redirects you to your strava page. All you need to do is authorize the permissions and then you're connected! 

You will be redirected to a page to set your heart rate, if you workout with a heart rate monitor you can gain "vigorous" experience points which are worth double normal.

Other commands you can use

- **!fit help** - Displays help
- **!fit profile** - View your level, recent activity and an overview of your last 30 days
- **!fit exp** - Gets your weekly exp
- **!fit leaderboard** - Shows everyone ranked by their fit score

## Experience Points

When you record an activity, the bot will calculate **experience points** based on the percieved effort and add them to your account. The EXP break down goes as follows:

- **1 EXP** per minute of "moderate" heart rate, which is defined as 50-75% of your max heart rate
- **2 EXP** per minute of "vigorous" heart rate, which is defined as greater than 75% of your max heart rate
- **1 EXP** per minute of the entire workout, if you didn't record heart rate or your max heart rate is set to 0

The EXP will be displayed at the bottom of the activity post like this

```
Gained 68.4 experience points (33.1+ 35.3++)
```

The `+` is your moderate exp and `++` is your vigorus exp (already doubled).

## Weekly Goals

The experience points are set up to reflect the recommended [activity from the WHO](https://www.who.int/dietphysicalactivity/factsheet_adults/en/#:~:text=Adults%20aged%2018%E2%80%9364%20should%20do%20at%20least%20150,an%20equivalent%20combination%20of%20moderate-%20and%20vigorous-intensity%20activity.). The bot also keeps track of your weekly exp gained, and gives everyone a goal of **150 exp** a week.

## Fit Score

Everyone will have a **fit score** which represents their streak of hitting the weekly goal. The fit score is a number from 0 - 100 that goes up when you hit the goal, and down when you miss the goal. 

Your score will go down by 5 if you gained 0 exp (recorded no activities), or will go down by 0-5 based on how close you got to the goal.. example: If you got 75 exp for the week, you will only lose 2.5 exp.

Along with a fit score you get a rank, which comes with a name, and the top 3 come with a unique discord role.

Rank | Rank Name | Fit Score | Role |
:-- | :--- | --- | --- |
0 | Bushtit | 0 | 
1 | Hummingbird | 1-19 |
2 | Goldfinch | 20-39 |
3 | Thrasher | 40-59 | 
4 | Kingfisher | 60-79 | 💦 break a sweat
5 | Peregrine Falcon | 80-99 | 💢 max effort
max | Golden Eagle | 100 | 💪 certified swole 