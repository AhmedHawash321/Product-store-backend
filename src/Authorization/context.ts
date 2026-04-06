import { verifyToken, getAuth } from "@clerk/express";
import { ENV } from "../config/env";

export interface GraphQLContext {
  userId: string | null;
  role: string;
}

export const createContext = async ({ req }: { req: any }): Promise<GraphQLContext> => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const payload = await verifyToken(token, { secretKey: ENV.CLERK_SECRET_KEY! });
        return { 
          userId: payload.sub, 
          role: (payload as any).metadata?.role ?? "user" 
        };
      }
    }

    const auth = getAuth(req);
    return { 
      userId: auth?.userId ?? null, 
      role: (auth?.sessionClaims?.metadata as any)?.role ?? "user" 
    };
  } catch (error) {
    return { userId: null, role: "user" };
  }
};