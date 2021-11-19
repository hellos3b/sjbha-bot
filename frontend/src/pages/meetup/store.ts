import { DateTime } from 'luxon';
import { derived, writable } from 'svelte/store';
import { Option } from 'prelude-ts';

export const MAX_DESCRIPTION_LENGTH = 1200;

export const MAX_LOCATION_COMMENTS_LENGTH = 300;

export const url = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export type Link = { id: symbol, url: string; label: string; }
export const Link = (url = '', label = '') : Link => ({ id: Symbol ('ID'), url, label });
  
export type Store = {
  id?: string;
  title: string;
  date: string;
  description: string;
  category: string;
  location: string;
  location_comments: string;
  location_linked: boolean;
  links: Map<symbol, Link>;
}

const state = writable<Store> ({
  title: '',
  date:  DateTime.now ()
    .set ({ minute: 0 })  // Looks better in the input field
    .plus ({ hours: 2 })  // Prevents 'Meetup is in the past' error on load
    .toISO (),
  description: '',
  category: 'default',
  location:    "",
  location_comments: "",
  location_linked: true,
  links:       new Map ()
});

export const store = {
  subscribe: state.subscribe,
  set<K extends keyof Store>(key: K, value: Store[K]) : void {
    state.update (current => ({
      ...current,
      [key]: value
    }));
  }
};

export const errors = derived (state, state$ => {
  const errors = new Map<string, string> ();

  if (!state$.title)
    errors.set ('title', 'Don\'t forget to give your meetup a title');

  if (DateTime.fromISO (state$.date).toMillis () <= DateTime.now ().toMillis ())
    errors.set ('date', 'Double check the date, it looks like the one you entered has already passed');

  if (state$.description.length > MAX_DESCRIPTION_LENGTH)
    errors.set ('description', 'Description is starting to get too long to fit');

  const linkErrors = new Map<symbol, string> ();
  state$.links.forEach (link => {
    if (link.label && !link.url)
      linkErrors.set (link.id, 'Don\'t forget to paste in the URL!');
    
    if (link.url && !url.test (link.url))
      linkErrors.set (link.id, 'Are you sure you copied this right? The URL doesn\'t look valid');
  });

  return {
    get:     (key: keyof Store) : string => errors.get (key) || '',
    getLink: (id: symbol) : string => linkErrors.get (id) || '',
    valid:   !errors.size && !linkErrors.size
  }
});

export async function fetchMeetup (id: string) : Promise<void> {
  const response = await fetch (`${__HOST__}/meetup/${id}`).then (r => r.json());
  const location = Option.ofNullable (response.location);

  state.set ({
    id,
    title: response.title,
    description: response.description,
    date: response.timestamp,
    category: response.category,

    location: location
      .map(l => l.value)
      .getOrElse(""),

    location_comments: location
      .map(l => l.comments)
      .getOrElse (""),

    location_linked: location
      .map(l => l.autoLink)
      .getOrElse (true),

    // todo: map links to map
    links: new Map()
  });
}