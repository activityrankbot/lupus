import type {
  AutocompleteInteraction,
  BaseInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import type {
  CommandOptionDataInput,
  ContextMenuDataInput,
  SubcommandDataInput,
} from '../builders.js';

export type Callback<T extends BaseInteraction> = (
  interaction: T
) => Promise<void> | void;

export interface RegisterContextMenu {
  data: ContextMenuDataInput;
  execute: Callback<ContextMenuCommandInteraction>;
  requiredPrivilegeLevel?: number;
}

export interface ContextMenuInformation {
  execute: Callback<ContextMenuCommandInteraction>;
  requiredPrivilegeLevel: number;
}

export type RegisterGroupedCommand = {
  data: SubcommandDataInput;
  requiredPrivilegeLevel?: number;
  groups?: SubcommandGroupReference[];
  subcommands?: SubcommandReference[];
};

type SubcommandGroupReference = {
  name: string;
  subcommands: SubcommandReference[];
};

export type RegisterCommand = {
  data: CommandOptionDataInput;
  execute: Callback<ChatInputCommandInteraction>;
  autocomplete?: Callback<AutocompleteInteraction>;
  requiredPrivilegeLevel?: number;
};

export type CommandInformation = {
  execute: Callback<ChatInputCommandInteraction>;
  autocomplete?: Callback<AutocompleteInteraction>;
  requiredPrivilegeLevel: number;
};

export interface RegisterSubcommand {
  name: string;
  execute: Callback<ChatInputCommandInteraction>;
  autocomplete?: Callback<AutocompleteInteraction>;
  requiredPrivilegeLevel?: number;
}

// make `admin` optional & require `name`
export type SubcommandReference = Pick<
  Partial<CommandInformation>,
  'requiredPrivilegeLevel'
> &
  Omit<CommandInformation, 'requiredPrivilegeLevel'> & { name: string };
