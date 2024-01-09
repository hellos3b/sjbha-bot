import superagent from "superagent";
import { EmbedBuilder } from "discord.js";
import {
  differenceInHours,
  intervalToDuration,
  isAfter,
  subDays,
} from "date-fns";
import { userCollection } from "./User";

const log = console.log.bind(console, "[fit/LoggedWorkout]");
const defaultAvatar =
  "https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png";

/**
 * @typedef {Object} LoggedWorkout
 * @prop {String} discordId
 * @prop {String} activityId
 * @prop {String} insertedDate
 * @prop {String} [messageId]
 * @prop {String} name
 * @prop {Number} exp
 * @prop {Boolean} expFromHR
 */

const expFromStreams = (maxHR, streams) => {
  const hrs = streams.find((s) => s.type === "heartrate")?.data ?? [];
  const ts = streams.find((s) => s.type === "time")?.data ?? [];

  if (!hrs || !ts) return null;

  const min = maxHR * 0.5;
  const max = maxHR * 0.9;

  let exp = 0;
  for (let i = 0; i < hrs.length; i++) {
    const scale = Math.min(1, Math.max(0, (hrs[i] - min) / (max - min)));
    const t = ts[i + 1] ? (ts[i + 1] - ts[i]) / 60 : 0;
    exp += t * (scale * 9 + 1);
  }

  return exp;
};

const expFromTime = (duration) => duration / 60;

const effortScore = (xp, score = 1) => {
  const needs = score * 5;
  return xp > needs ? effortScore(xp - needs, score + 1) : score + xp / needs;
};

const workoutFromActivity = (user, activity, streams) => {
  const exp = user.maxHR ? expFromStreams(user.maxHR, streams) : null;

  return {
    discordId: user.discordId,
    activityId: activity.id,
    insertedDate: new Date().toISOString(),
    name: activity.name,
    exp: exp ?? expFromTime(activity.moving_time),
    expFromHR: Boolean(exp),
  };
};

const ActivityType = {
  RIDE: "Ride",
  RUN: "Run",
  YOGA: "Yoga",
  HIKE: "Hike",
  WALK: "Walk",
  WORKOUT: "Workout",
  CROSSFIT: "Crossfit",
  VIRTUAL_RIDE: "VirtualRide",
  ROCK_CLIMB: "RockClimbing",
  WEIGHT_TRAIN: "WeightTraining",
  GOLF: "Golf",
  SWIM: "Swim",
};

const SportType = {
  PICKLEBALL: "Pickleball",
};

// workout type of user is inputed
const WorkoutType = {
  RUN_WORKOUT: 3,
  RIDE_WORKOUT: 12,
};

const pad = (x) => String(x).padStart(2, "0");

const formatDuration = (elapsed) => {
  const d = intervalToDuration({ start: 0, end: elapsed * 1000 });
  if (d.hours >= 1) return `${d.hours}:${pad(d.minutes)}:${pad(d.seconds)}`;
  else if (d.minutes > 0) return `${pad(d.minutes)}:${pad(d.seconds)}`;
  else return `${pad(d.seconds)} seconds`;
};

const formatPace = (pace) => {
  const asMinutes = 26.8224 / pace;
  const d = intervalToDuration({ start: 0, end: asMinutes * 60 * 1000 });
  return d.hours >= 1
    ? `${d.hours}:${pad(d.minutes)}:${pad(d.seconds)}`
    : `${pad(d.minutes)}:${pad(d.seconds)}`;
};

// Different activities have different activity stats that are worth showing.
// We'll figure out which ones to show here, otherwise default to heartrate stats (if available)
const activityText = (activity) => {
  const elapsed = formatDuration(activity.elapsed_time);
  const distance =
    activity.distance > 0
      ? (activity.distance * 0.000621371192).toFixed(2) + "mi"
      : "";

  const elevation =
    activity.total_elevation_gain > 0
      ? (activity.total_elevation_gain * 3.2808399).toFixed(0) + "ft"
      : "";

  const pace =
    activity.average_speed > 0
      ? formatPace(activity.average_speed) + "/mi"
      : "";

  const avgWatts =
    activity.weighted_average_watts > 0
      ? activity.weighted_average_watts.toFixed(0) + "w"
      : "";

  switch (activity.type) {
    case ActivityType.RIDE:
      if (activity.workout_type === WorkoutType.RIDE_WORKOUT) {
        return avgWatts
          ? `did a bike workout averaging ${avgWatts} for ${elapsed}`
          : `did a bike workout for ${elapsed}`;
      }
      if (distance) {
        const msg = `rode their bike ${distance} in ${elapsed}`;
        if (avgWatts) return msg + ` and averaged ${avgWatts}`;
        else if (elevation) return msg + `, climbing ${elevation}`;
        else return msg;
      }
      return `rode their bike for ${elapsed}`;

    case ActivityType.RUN:
      if (activity.workout_type === WorkoutType.RUN_WORKOUT)
        return `did a ${elapsed} running working`;
      else if (distance && pace)
        return `ran ${distance} in ${elapsed} (avg pace ${pace})`;
      else if (distance) return `ran ${distance} in ${elapsed}`;
      else return `ran for ${elapsed}`;

    case ActivityType.HIKE:
      if (distance && elevation)
        return `hiked ${distance} up ${elevation} in ${elapsed}`;
      if (distance) return `hiked ${distance} in ${elapsed}`;
      return `hiked for ${elapsed}`;

    case ActivityType.VIRTUAL_RIDE:
      return `did a virtual ride for ${elapsed}`;

    case ActivityType.WALK:
      return distance
        ? `walked ${distance} in ${elapsed}`
        : `walked for ${elapsed}`;

    case ActivityType.WEIGHT_TRAIN:
      return `lifted weights for ${elapsed}`;

    case ActivityType.YOGA:
      return `did yoga for ${elapsed}`;

    case ActivityType.CROSSFIT:
      return `did crossfit for ${elapsed}`;

    case ActivityType.ROCK_CLIMB:
      return `went rock climbing for ${elapsed}`;

    case ActivityType.GOLF:
      return `walked ${distance} while playing golf`;

    case ActivityType.SWIM:
      return `swam ${distance} for ${elapsed}`;

    case ActivityType.WORKOUT: {
      switch (activity.sport_type) {
        case SportType.PICKLEBALL:
          return `played pickleball for ${elapsed}`;
      }
    }
  }
  return `worked out for ${elapsed}`;
};

const createActivityEmbed = (activity, loggedWorkout, member) =>
  new EmbedBuilder()
    .setColor(member.displayColor)
    .setAuthor({
      iconURL: member.user?.displayAvatarURL() ?? defaultAvatar,
      name: `${member.displayName} ${activityText(activity)}`,
    })
    .setFooter({
      text: (() => {
        const hr = activity.has_heartrate
          ? `hr ${activity.max_heartrate} max ${activity.average_heartrate} avg | `
          : "";
        return (
          hr +
          `💦 ${effortScore(loggedWorkout.exp).toFixed(1)}` +
          (!loggedWorkout.expFromHR ? "†" : "")
        );
      })(),
    });

// We won't post workouts from users who have gone inactive.
const isInactive = (user) => {
  const lastActive = new Date(user.lastActive || 0);
  const limit = subDays(new Date(), 14);
  return isAfter(limit, lastActive);
};

const isTooOld = (activity) => {
  const started = new Date(activity.start_date);
  const age = differenceInHours(new Date(), started);
  return age > 48;
};

// -- strava api

const fetchToken = (refreshToken) =>
  superagent
    .post("https://www.strava.com/oauth/token")
    .send({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
    })
    .then((r) => r.body.access_token);

const fetchActivity = (activityId, accessToken) =>
  superagent
    .get(`https://www.strava.com/api/v3/activities/${activityId}`)
    .auth(accessToken, { type: "bearer" })
    .then((r) => r.body);

const fetchStreams = (activityId, accessToken) =>
  superagent
    .get(`https://www.strava.com/api/v3/activities/${activityId}/streams`)
    .query({ keys: "heartrate,time" })
    .auth(accessToken, { type: "bearer" })
    .then((r) => r.body);

/** @returns {import("mongodb").Collection<LoggedWorkout>} */
const loggedWorkoutCollection = (db) => db.collection("fit-workout");

const postWorkout = (discord, db) => async (stravaId, activityId) => {
  const user = await userCollection(db).findOne({ stravaId });

  if (!user?.stravaId)
    return new Error(`Strava ID '${stravaId}' is not authorized with the bot.`);

  if (isInactive(user))
    return new Error(`User '${user.discordId}' hasn't posted in a while`);

  const member = await discord.guilds
    .fetch(process.env.SERVER_ID)
    .then((x) => x.members.fetch(user.discordId));

  if (!member) {
    return new Error("User is not a member of this discord anymore");
  }

  // Fetch the details
  const data = await fetchToken(user.refreshToken)
    .then((token) =>
      Promise.all([
        fetchActivity(activityId, token),
        fetchStreams(activityId, token),
      ])
    )
    .catch((e) => e);

  if (data instanceof Error) {
    return new Error(`Failed to fetch activity data '${activityId}'`, {
      cause: data,
    });
  }

  const [activity, streams] = data;
  if (isTooOld(activity)) {
    return new Error(
      `Activity is too old. It was started ${started.toLocaleDateString()} and today is ${new Date().toLocaleDateString()}`
    );
  }

  const workouts = loggedWorkoutCollection(db);
  const workout = workoutFromActivity(user, activity, streams);
  const embed = createActivityEmbed(activity, workout, member);

  const existing = await workouts.findOne({ activityId });
  const channel = await discord.channels.fetch(process.env.CHANNEL_STRAVA);
  const message = existing?.messageId
    ? await channel.messages
        .fetch(existing.messageId)
        .then((x) => x.edit({ embeds: [embed] }))
    : await channel.send({ embeds: [embed] });

  await loggedWorkoutCollection(db).updateOne(
    { activityId },
    { $set: { ...workout, messageId: message.id } },
    { upsert: true }
  );
};

/**
 * @param {import("discord.js").Client} discord
 * @param {import("mongodb").Db} db
 */
export const stravaWebhookHandler = (discord, db) => {
  // When an activity is first posted as 'created',
  // We'll give the user some (n) amount of time to edit their activity
  // This set just keeps track of which activities are waiting to be posted
  const pendingPosts = new Set();
  const post = postWorkout(discord, db);

  return async (req) => {
    const { object_type, aspect_type, object_id, owner_id } = req.payload;

    if (object_type === "athlete") {
      return "Ignoring athlete update";
    }

    // Do not have a current feature to delete
    // a posted workout, but it's on the TODO list
    if (aspect_type === "delete") {
      return "DELETE not yet supported.";
    }

    if (pendingPosts.has(object_id)) {
      return "Already posting this activity";
    }

    pendingPosts.add(object_id);

    const delay =
      process.env.NODE_ENV === "production" && aspect_type === "create"
        ? 60 * 1000
        : 0;

    log("Incoming Activity Post", req.params);

    setTimeout(() => {
      post(owner_id, object_id)
        .then((x) => {
          if (x instanceof Error)
            log(`Activity '${object_id}' did not get posted:`, x.message);
        })
        .catch((err) =>
          log(new Error("Failed to post workout", { cause: err }))
        )
        .finally(() => pendingPosts.delete(object_id));
    }, delay);

    return "Done!";
  };
};
