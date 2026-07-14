export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface TravelConflictReport {
  isConflict: boolean;
  driveTimeMinutes: number;
  message: string;
}

export class LogisticsService {
  private static AVERAGE_DRIVE_SPEED_MPH = 30; // average city speed for buffer bounds

  /**
   * Calculates driving distance using the Haversine formula to approximate time
   * and flags travel buffers that are too tight.
   */
  public static checkTravelConflict(
    locA: Location,
    timeAEnd: Date,
    locB: Location,
    timeBStart: Date
  ): TravelConflictReport {
    // 1. Calculate time gap (in minutes)
    const gapMinutes = (timeBStart.getTime() - timeAEnd.getTime()) / (1000 * 60);

    // If events overlap or event B starts before event A ends, it's a direct scheduling overlap conflict
    if (gapMinutes <= 0) {
      return {
        isConflict: true,
        driveTimeMinutes: 0,
        message: `Direct Conflict: Overlapping events. Time gap is ${gapMinutes} minutes.`,
      };
    }

    // 2. Estimate distance between coordinates (Miles) using Haversine
    const distanceMiles = this.haversineDistance(locA.lat, locA.lng, locB.lat, locB.lng);

    // 3. Estimate travel duration
    // driveTime = distance / speed
    const driveTimeHours = distanceMiles / this.AVERAGE_DRIVE_SPEED_MPH;
    const driveTimeMinutes = Math.round(driveTimeHours * 60);

    // 4. Invariant buffer check: drive time + 10-minute buffer (tight travel alert)
    const requiredBuffer = driveTimeMinutes + 10;

    if (gapMinutes < requiredBuffer) {
      return {
        isConflict: true,
        driveTimeMinutes,
        message: `Conflict: Tight Travel (Est. drive time: ${driveTimeMinutes} mins between ${locA.name} and ${locB.name}. Gap is only ${Math.round(gapMinutes)} mins).`,
      };
    }

    return {
      isConflict: false,
      driveTimeMinutes,
      message: "No travel conflict detected.",
    };
  }

  // Helper: Haversine distance formula
  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Radius of Earth in Miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
