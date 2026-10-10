import { fetchSchedule } from "./anilist.adapter.js";

export default async function getSchedInfo(date) {
  try {
    const results = await fetchSchedule(date);
    return results;
  } catch (error) {
    console.error("Error fetching schedule info:", error);
    return [];
  }
}
