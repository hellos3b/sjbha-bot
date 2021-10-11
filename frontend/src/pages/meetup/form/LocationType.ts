export type LocationType = {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

const LocationType = (id: string, name: string, icon: string) : LocationType => ({ id, name, icon });

export const address = LocationType ('address', 'Address', 'place')
export const privateAddress = LocationType ('private', 'Private Address', 'lock');
export const voiceChat = LocationType ('voice', 'Voice Chat', 'volume_up');