import { verifyAndDecodeToken } from "./auth";

class StatelessStore {
  get(token: string): string | undefined {
    return verifyAndDecodeToken(token);
  }
  set(token: string, value: string): void {
    // no-op: tokens are stateless and contain signed payload
  }
}

export const tokensStore = new StatelessStore();
export const adminTokensStore = new StatelessStore();

