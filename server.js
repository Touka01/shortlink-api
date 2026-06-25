const { createApp, createDb } = require("./app");

const port = process.env.PORT || 3000;
const db = createDb(process.env.DB_FILE);
const app = createApp(db);

app.listen(port, () => {
  console.log(`shortlink-api listening on http://localhost:${port}`);
});
