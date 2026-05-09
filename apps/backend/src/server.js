import { app } from "./app.js";
import { env } from "./config/env.js";
import { startReminderScheduler } from "./services/reminderService.js";

app.listen(env.port, () => {
  console.log(`Backend running on port ${env.port}`);
  startReminderScheduler();
});
