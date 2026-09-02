export class TimeSystem {
  constructor() {
    this.day = 1;
    this.hour = 9; // 9:00 AM
    this.minute = 0;
    this.timer = null;
  }

  advanceTime(minutes) {
    this.minute += minutes;
    while (this.minute >= 60) {
      this.minute -= 60;
      this.hour += 1;
    }
    while (this.hour >= 24) {
      this.hour -= 24;
      this.day += 1;
    }
  }

  getTimeString() {
    const period = this.hour >= 12 ? 'PM' : 'AM';
    const displayHour = this.hour % 12 === 0 ? 12 : this.hour % 12;
    const displayMin = this.minute.toString().padStart(2, '0');
    return `Day ${this.day} - ${displayHour}:${displayMin} ${period}`;
  }

  isNight() {
    return this.hour >= 20 || this.hour < 6;
  }

  getSkyOverlayColor() {
    if (this.hour >= 6 && this.hour < 18) {
      return 'rgba(0,0,0,0)'; // Daylight
    } else if (this.hour >= 18 && this.hour < 20) {
      return 'rgba(180, 80, 20, 0.25)'; // Ghibli Sunset
    } else {
      return 'rgba(15, 20, 45, 0.55)'; // Ghibli Night
    }
  }
}
