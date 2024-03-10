import {
  ApplicationCommandOptionType,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type CommandInteraction,
  type ContextMenuCommandInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { setSingletonCommands } from './index.js';
import {
  CommandKey,
  makeInteractionKey,
  makeKey,
  refineContextMenuData,
  refineSlashCommandData,
} from './util/builders.js';
import type {
  CommandInformation,
  ContextMenuInformation,
  RegisterCommand,
  RegisterContextMenu,
  RegisterGroupedCommand,
  RegisterSubcommand,
  SubcommandReference,
} from './util/types/command.js';
import { CommandHandleError } from './util/errors.js';
import { PrivilegeManager } from 'PrivilegeManager.js';

export class Registry {
  protected data: RegistryData = {
    commands: new Map(),
    commandData: [],
    contextMenus: new Map(),
  };

  private privilege: PrivilegeManager;

  constructor(opts: RegistryOptions) {
    this.privilege = opts.privilegeManager;
    return setSingletonCommands(this);
  }

  // re-export ApplicationCommandOptionType
  public OptionType = ApplicationCommandOptionType;

  registerContextMenu(meta: RegisterContextMenu) {
    const data = refineContextMenuData(meta.data);

    const privilegeLevel =
      meta.requiredPrivilegeLevel ?? this.privilege.defaultLevel;

    this.data.contextMenus.set(data.name, {
      execute: meta.execute,
      requiredPrivilegeLevel: privilegeLevel,
    });

    this.data.commandData.push({
      body: data,
      admin: privilegeLevel > this.privilege.defaultLevel,
    });

    // logger.debug(`Loaded context command [${meta.data.name}]`);
  }

  registerGroupedCommand(meta: RegisterGroupedCommand) {
    const data = refineSlashCommandData(meta.data);

    const rootPrivilegeLevel =
      meta.requiredPrivilegeLevel ?? this.privilege.defaultLevel;

    // if _any_ part of the command has a privilegeLevel higher than default
    // the entire command is classed as `admin`
    // This is because Discord only allows commands
    // to be registered at the root level.
    let commandIsAdmin = rootPrivilegeLevel > this.privilege.defaultLevel;

    if (meta.groups) {
      for (const group of meta.groups) {
        for (const command of group.subcommands) {
          const requiredPrivilegeLevel =
            command.requiredPrivilegeLevel ??
            meta.requiredPrivilegeLevel ??
            this.privilege.defaultLevel;

          if (requiredPrivilegeLevel > this.privilege.defaultLevel)
            commandIsAdmin = true;

          this.registerCommandInfo(
            makeKey(data.name, group.name, command.name),
            { ...command, requiredPrivilegeLevel }
          );
        }
      }
    }

    if (meta.subcommands) {
      for (const command of meta.subcommands) {
        const requiredPrivilegeLevel =
          command.requiredPrivilegeLevel ??
          meta.requiredPrivilegeLevel ??
          this.privilege.defaultLevel;

        if (requiredPrivilegeLevel > this.privilege.defaultLevel)
          commandIsAdmin = true;

        this.registerCommandInfo(makeKey(data.name, command.name), {
          ...command,
          requiredPrivilegeLevel,
        });
      }
    }

    this.data.commandData.push({ body: data, admin: commandIsAdmin });
  }

  registerCommand(meta: RegisterCommand) {
    const data = refineSlashCommandData(meta.data);

    this.registerCommandInfo(makeKey(data.name), meta);

    const privilegeLevel =
      meta.requiredPrivilegeLevel ?? this.privilege.defaultLevel;

    this.data.commandData.push({
      body: data,
      admin: privilegeLevel > this.privilege.defaultLevel,
    });
  }

  private registerCommandInfo(
    key: string,
    meta: Omit<RegisterCommand, 'data'>
  ) {
    const requiredPrivilegeLevel =
      meta.requiredPrivilegeLevel ?? this.privilege.defaultLevel;

    this.data.commands.set(key, {
      execute: meta.execute,
      autocomplete: meta.autocomplete,
      requiredPrivilegeLevel,
    });

    // logger.debug(`Loaded command callback [${key}]`);
  }

  generateSubcommand(meta: RegisterSubcommand): SubcommandReference {
    // TODO: runtime validation. for now, this is just a passthrough.
    return meta;
  }

  async handleAutocompleteInteraction(interaction: AutocompleteInteraction) {
    const key = makeInteractionKey(interaction);
    const ref = this.data.commands.get(key);
    if (!ref) {
      throw new CommandHandleError({
        name: 'COMMAND_NOT_FOUND',
        message: `Failed to find command matching key "${key}" when processing autocomplete`,
      });
    }

    if (!ref.autocomplete) {
      throw new CommandHandleError({
        name: 'AUTOCOMPLETE_NOT_FOUND',
        message: `No autocomplete method found on command ${interaction.commandName}`,
      });
    }

    if (
      !this.privilege.userHasPrivilege(
        interaction.user,
        ref.requiredPrivilegeLevel
      )
    ) {
      throw new CommandHandleError({
        name: 'LACKING_PRIVILIGES',
        message: `User ${interaction.user.id} is missing privileges ${ref.requiredPrivilegeLevel} to run autocomplete on command ${key}`,
      });
    }

    try {
      await ref.autocomplete(interaction);
    } catch (e) {
      throw new CommandHandleError({
        name: 'AUTOCOMPLETE_THROWN',
        message: `The autocomplete method for ${interaction.commandName} threw an error while executing`,
        cause: e,
      });
    }
  }

  async handleChatInputInteraction(interaction: ChatInputCommandInteraction) {
    const key = makeInteractionKey(interaction);
    const ref = this.data.commands.get(key);

    if (!ref) {
      throw new CommandHandleError({
        name: 'COMMAND_NOT_FOUND',
        message: `Failed to find command matching key "${key}" when processing command`,
      });
    }

    if (
      !this.privilege.userHasPrivilege(
        interaction.user,
        ref.requiredPrivilegeLevel
      )
    ) {
      throw new CommandHandleError({
        name: 'LACKING_PRIVILIGES',
        message: `User ${interaction.user.id} is missing privileges ${ref.requiredPrivilegeLevel} to execute privileged command ${key}`,
      });
    }

    try {
      await ref.execute(interaction);
    } catch (e) {
      throw new CommandHandleError({
        name: 'COMMAND_THROWN',
        message: `The execute method for command matching key "${key}" threw an error`,
        cause: e,
      });
    }
  }

  async handleContextMenuInteraction(
    interaction: ContextMenuCommandInteraction
  ) {
    const key = makeInteractionKey(interaction);
    const ref = this.data.contextMenus.get(key);

    if (!ref) {
      throw new CommandHandleError({
        name: 'MENU_NOT_FOUND',
        message: `Failed to find context menu matching key "${key}" when processing`,
      });
    }

    if (
      !this.privilege.userHasPrivilege(
        interaction.user,
        ref.requiredPrivilegeLevel
      )
    ) {
      throw new CommandHandleError({
        name: 'LACKING_PRIVILIGES',
        message: `User ${interaction.user.id} is missing privileges ${ref.requiredPrivilegeLevel} to execute privileged context menu ${key}`,
      });
    }

    try {
      await ref.execute(interaction);
    } catch (e) {
      throw new CommandHandleError({
        name: 'MENU_THROWN',
        message: `The execute method for context menu matching key "${key}" threw an error`,
        cause: e,
      });
    }
  }

  async handleInteraction(
    interaction: CommandInteraction | AutocompleteInteraction
  ) {
    if (interaction.isAutocomplete()) {
      return await this.handleAutocompleteInteraction(interaction);
    } else if (interaction.isChatInputCommand()) {
      return await this.handleChatInputInteraction(interaction);
    } else if (interaction.isContextMenuCommand()) {
      return await this.handleContextMenuInteraction(interaction);
    }
  }
}

interface RegistryData {
  commands: Map<CommandKey, CommandInformation>;
  commandData: {
    body: RESTPostAPIApplicationCommandsJSONBody;
    admin: boolean;
  }[];
  contextMenus: Map<string, ContextMenuInformation>;
}

export interface RegistryOptions {
  privilegeManager: PrivilegeManager;
}
