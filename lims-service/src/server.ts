import app from "./app";
import ENV from "./utils/environment";

const PORT = ENV.PORT || 9002;

app.listen(PORT, () => {
  console.log(`LIMS Service running on http://localhost:${PORT}`);
});
