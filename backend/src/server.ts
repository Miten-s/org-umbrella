import app from "./app";
import ENV from "./utils/environment";

const PORT = ENV.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
