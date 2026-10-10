import { fetchVoiceActors } from "./anilist.adapter.js";

export default async function fetchVoiceActorInfo(id, page = 1) {
  try {
    const data = await fetchVoiceActors(id, page);
    return data;
  } catch (error) {
    console.error("Error fetching voice actor info:", error);
    return { data: [], totalPages: 1 };
  }
}
