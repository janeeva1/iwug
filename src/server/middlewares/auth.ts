import type { RequestHandler } from "express";
import { getSessionToken, getSessionUser, isAdmin } from "../lib/session";

/** Loads the signed-in user (if any) onto `req.user`. */
export const attachUser: RequestHandler = async (req, _res, next) => {
  try {
    req.user = await getSessionUser(getSessionToken(req));
    next();
  } catch (err) {
    next(err);
  }
};

export const requireUser: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  if (!isAdmin(req.user)) {
    res.status(403).json({ error: "Administrator access required." });
    return;
  }
  next();
};
