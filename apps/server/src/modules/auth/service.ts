import { auth } from "@publicdraft/auth";
import { status } from "elysia";

export abstract class AuthService {
  static async requireAuth(request: Request) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw status(401, "Unauthorized");
    }

    return session;
  }
}