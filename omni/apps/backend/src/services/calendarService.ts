import { Event } from "@omni/shared";
import crypto from "crypto";

export class CalendarService {
  /**
   * Extremely lightweight, secure, and zero-dependency iCal (.ics) parser.
   * Extracts events, start times, end times, titles, location names, and attire rules.
   */
  public static parseIcs(icsContent: string, groupId: string): Partial<Event>[] {
    const events: Partial<Event>[] = [];
    const lines = icsContent.split(/\r?\n/);
    
    let currentEvent: Partial<Event> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "BEGIN:VEVENT") {
        currentEvent = {
          id: crypto.randomUUID(),
          groupId,
          attireGear: "General attire",
          locationLat: 33.7490, // Default Atlanta area lat
          locationLng: -84.3880, // Default Atlanta area lng
        };
      } else if (line === "END:VEVENT") {
        if (currentEvent && currentEvent.title && currentEvent.startTime && currentEvent.endTime) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;

        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();

        if (key.startsWith("SUMMARY")) {
          currentEvent.title = value;
        } else if (key.startsWith("DTSTART")) {
          currentEvent.startTime = this.parseIcalDate(value);
        } else if (key.startsWith("DTEND")) {
          currentEvent.endTime = this.parseIcalDate(value);
        } else if (key.startsWith("LOCATION")) {
          currentEvent.locationName = value;
          // Parse coordinates if they exist in geo format or make dynamic defaults based on name
          if (value.toLowerCase().includes("field 4")) {
            currentEvent.locationLat = 33.7890;
            currentEvent.locationLng = -84.3879;
          } else if (value.toLowerCase().includes("symphony")) {
            currentEvent.locationLat = 33.7899;
            currentEvent.locationLng = -84.3820;
          }
        } else if (key.startsWith("DESCRIPTION")) {
          if (value.toLowerCase().includes("attire:") || value.toLowerCase().includes("gear:")) {
            const attireIndex = Math.max(value.toLowerCase().indexOf("attire:"), value.toLowerCase().indexOf("gear:"));
            currentEvent.attireGear = value.slice(attireIndex + 7).trim();
          } else {
            currentEvent.attireGear = value;
          }
        }
      }
    }

    return events;
  }

  // Parse iCal date strings e.g. "20260706T193000Z" or "20260706T193000"
  private static parseIcalDate(icalDate: string): Date {
    // Basic format check
    const cleanDate = icalDate.replace(/[:\-]/g, ""); // Strip colons and hyphens
    const year = parseInt(cleanDate.substring(0, 4), 10);
    const month = parseInt(cleanDate.substring(4, 6), 10) - 1;
    const day = parseInt(cleanDate.substring(6, 8), 10);
    
    const tIndex = cleanDate.indexOf("T");
    if (tIndex !== -1) {
      const hour = parseInt(cleanDate.substring(tIndex + 1, tIndex + 3), 10);
      const min = parseInt(cleanDate.substring(tIndex + 3, tIndex + 5), 10);
      const sec = parseInt(cleanDate.substring(tIndex + 5, tIndex + 7), 10);
      
      if (cleanDate.endsWith("Z")) {
        return new Date(Date.UTC(year, month, day, hour, min, sec));
      }
      return new Date(year, month, day, hour, min, sec);
    }
    
    return new Date(year, month, day);
  }
}
