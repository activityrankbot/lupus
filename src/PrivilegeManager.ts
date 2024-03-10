import { User } from 'discord.js';

export class PrivilegeManager {
  readonly defaultLevel: number;

  constructor(
    readonly privilegedUsers: Record<string, number>,
    defaultLevel?: number
  ) {
    this.defaultLevel = defaultLevel ?? 0;
  }

  userLevel(user: User): number {
    return this.privilegedUsers[user.id] ?? 0;
  }

  userHasPrivilege(user: User, privilege: number): boolean {
    return this.userLevel(user) >= privilege;
  }
}
