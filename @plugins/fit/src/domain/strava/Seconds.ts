export default class Seconds {
  constructor(
    public readonly value: number
  ) {}

  /**
   * Formats the time in a friendly string format, like "15m 41s"
   */
  toString() {
    var hours = Math.floor(this.value / (60 * 60));

    var divisor_for_minutes = this.value % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }

    return `${seconds}s`;
  }

  /**
   * Converts it to HH:MM:SS format 
   */
  get hhmmss() {
    let secs = this.value;

    let minutes = Math.floor(secs / 60);
    secs = Math.floor(secs%60);

    let hours = Math.floor(minutes/60)
    minutes = minutes%60;

    let result = "";
    if (hours > 0) {
      result += hours+":";
      result += minutes.toString().padStart(2, "0");
    } else {
      result += minutes.toString()
    }

    result += ":" + secs.toString().padStart(2, "0");
    return result;
  }
}