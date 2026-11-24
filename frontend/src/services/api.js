import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000/api"
});

export async function getComments() {
  const response = await api.get("/moderation/comments");
  return response.data;
}

export default api;
