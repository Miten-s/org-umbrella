import redisClient, { connectRedis } from "../configs/redis.config";
import {
  invalidateUserContext,
  invalidateAllUserContexts
} from "./user-context.service";

export const RBAC_INVALIDATE_CHANNEL = "rbac:invalidate";

type RbacInvalidationMessage =
  | { scope: "user"; platformUserId: string }
  | { scope: "all" };

/** Exported for tests — the routing decision is the part worth pinning down. An
 * unrecognised message drops every context rather than being ignored: over-invalidating
 * costs a recompute, under-invalidating serves a revoked permission. */
export const handleInvalidationMessage = async (raw: string): Promise<void> => {
  let message: RbacInvalidationMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    console.error("rbac invalidation: unparseable message, dropping all contexts");
    await invalidateAllUserContexts();
    return;
  }

  if (message?.scope === "user" && message.platformUserId) {
    await invalidateUserContext(message.platformUserId);
    return;
  }

  await invalidateAllUserContexts();
};

/** node-redis puts a connection into subscriber mode exclusively, so this needs its own
 * connection — the shared client still has to serve normal cache reads and writes. */
export const startRbacInvalidationSubscriber = async () => {
  await connectRedis();

  const subscriber = redisClient.duplicate();
  subscriber.on("error", (error) =>
    console.error("rbac invalidation subscriber error:", error)
  );

  await subscriber.connect();
  await subscriber.subscribe(RBAC_INVALIDATE_CHANNEL, (raw) => {
    void handleInvalidationMessage(raw);
  });

  console.log("gxp-service: subscribed to rbac invalidation");
  return subscriber;
};
