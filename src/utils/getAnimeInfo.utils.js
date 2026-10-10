import { fetchAnimeDetails } from "./anilist.adapter.js";

export default async function fetchAnimeInfo(id, random = false) {
  try {
    const details = await fetchAnimeDetails(id, random);
    return details;
  } catch (error) {
    console.error("Error fetching anime info:", error);
    throw error;
  }
}
