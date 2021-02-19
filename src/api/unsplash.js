import axios from "axios";

export default axios.create({
  baseURL: "https://api.unsplash.com/",
  headers: {
    Authorization: "Client-ID O3rLFqpPo-J7uc6VSgVZGyBMb4SSNg-EYMcIWeVeQ1Q",
  },
});
