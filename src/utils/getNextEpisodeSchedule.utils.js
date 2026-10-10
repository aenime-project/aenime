import { fetchNextSchedule } from "./anilist.adapter.js";

const getNextEpisodeSchedule = async (id) => {
  try {
    const data = await fetchNextSchedule(id);
    return data;
  } catch (err) {
    console.error("Error fetching next episode schedule:", err);
    return null;
  }
};

export default getNextEpisodeSchedule;
