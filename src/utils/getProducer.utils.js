import { fetchProducerAnime } from "./anilist.adapter.js";

const getProducer = async (producer, page = 1) => {
  try {
    const data = await fetchProducerAnime(producer, page);
    return data;
  } catch (err) {
    console.error("Error fetching producer info:", err);
    return { data: [], totalPages: 1 };
  }
};

export default getProducer;
