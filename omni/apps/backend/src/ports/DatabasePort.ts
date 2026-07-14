import { ParentProfile, PlayerProfile, AccountSettings } from "@omni/shared";

export interface DatabasePort {
  createParent(email: string, phone: string, ssoProvider?: string): Promise<ParentProfile>;
  createPlayer(parentId: string, name: string, dateOfBirth: Date): Promise<PlayerProfile>;
  getParentById(parentId: string, activeParentId: string): Promise<ParentProfile | null>;
  getPlayersForParent(parentId: string, activeParentId: string): Promise<PlayerProfile[]>;
  
  // Settings & SSO Ports
  getUserSettings(parentProfileId: string, activeParentId: string): Promise<AccountSettings>;
  updateUserSettings(parentProfileId: string, settings: Partial<AccountSettings>, activeParentId: string): Promise<AccountSettings>;
  updateUserRoles(parentProfileId: string, roles: string[], activeParentId: string): Promise<string[]>;
  authenticateSSO(provider: string, email: string, name?: string): Promise<ParentProfile>;
}
