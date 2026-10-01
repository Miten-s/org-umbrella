import redisClient, { connectRedis } from "../configs/redis.config";

export const RBAC_INVALIDATE_CHANNEL = "rbac:invalidate";

/** `user` narrows the blast radius to one person's cached context (a role assignment
 * changed). `all` is for changes whose affected users are unknown from here — editing a
 * role's permissions touches everyone holding it. */
export type RbacInvalidationMessage =
  { scope: "user"; platformUserId: string } | { scope: "all" };

/** Tells other services to drop cached permissions now rather than waiting out their TTL.
 * Deliberately never throws: a mutation must not fail because a notification did not go
 * out. Subscribers still have their TTL as the missed-message safety net. */
export const publishRbacInvalidation = async (
  message: RbacInvalidationMessage
): Promise<void> => {
  try {
    await connectRedis();
    await redisClient.publish(RBAC_INVALIDATE_CHANNEL, JSON.stringify(message));
  } catch (error) {
    console.error("rbac invalidation publish failed:", error);
  }
};
