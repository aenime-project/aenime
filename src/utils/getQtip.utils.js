import { fetchQtip } from "./anilist.adapter.js";

const getQtip = async (id) => {
  try {
    const data = await fetchQtip(id);
    return data;
  } catch (err) {
    console.error("Error fetching qtip info:", err);
    return null;
  }
};

export default getQtip;
