import type {
  ContextMenuCommandBuilder,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  APIApplicationCommandBasicOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  AutocompleteInteraction,
  CommandInteraction,
} from 'discord.js';

export type SubcommandDataInput =
  | SlashCommandSubcommandsOnlyBuilder
  | (Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'options'> & {
      options?: (
        | APIApplicationCommandSubcommandGroupOption
        | APIApplicationCommandSubcommandOption
      )[];
    });

export type CommandOptionDataInput =
  | SlashCommandOptionsOnlyBuilder
  | (Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'options'> & {
      options?: APIApplicationCommandBasicOption[];
    });

export const refineSlashCommandData = (
  data: SubcommandDataInput | CommandOptionDataInput
): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  'toJSON' in data ? data.toJSON() : data;

export type ContextMenuDataInput =
  | ContextMenuCommandBuilder
  | RESTPostAPIContextMenuApplicationCommandsJSONBody;

export const refineContextMenuData = (
  data: ContextMenuDataInput
): RESTPostAPIContextMenuApplicationCommandsJSONBody =>
  'toJSON' in data ? data.toJSON() : data;

export type CommandKey = string;

export function makeInteractionKey(
  interaction: CommandInteraction | AutocompleteInteraction
) {
  const root =
    interaction.isChatInputCommand() || interaction.isAutocomplete()
      ? [
          interaction.commandName,
          interaction.options.getSubcommandGroup(false),
          interaction.options.getSubcommand(false),
        ]
      : [interaction.commandName];

  return root.filter(Boolean).join('.');
}
export const makeKey = (...args: string[]): CommandKey => args.join('.');
