import { Router } from "express";

const router = Router();

router.get("/", async (request, response) => {
  return response.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

export default router;
