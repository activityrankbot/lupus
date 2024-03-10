import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ComponentType,
  Interaction,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from 'discord.js';

export type CachedComponentData = string | undefined | null | void;

interface BaseComponentData<
  T extends ComponentType,
  I extends Interaction<'cached'>,
  D extends CachedComponentData
> {
  callback: (args: {
    interaction: I;
    data: D;
    dropCustomId: () => void;
  }) => Promise<void> | void;
  type: T;
}

interface BaseRegisterComponent<
  T extends ComponentType,
  I extends Interaction<'cached'>,
  D extends CachedComponentData
> extends BaseComponentData<T, I, D> {
  identifier?: string;
}

export type RegisterComponent<D extends CachedComponentData> =
  | BaseRegisterComponent<ComponentType.Button, ButtonInteraction<'cached'>, D>
  | BaseRegisterComponent<
      ComponentType.StringSelect,
      StringSelectMenuInteraction<'cached'>,
      D
    >
  | BaseRegisterComponent<
      ComponentType.RoleSelect,
      RoleSelectMenuInteraction<'cached'>,
      D
    >
  | BaseRegisterComponent<
      ComponentType.ChannelSelect,
      ChannelSelectMenuInteraction<'cached'>,
      D
    >
  | BaseRegisterComponent<
      ComponentType.UserSelect,
      UserSelectMenuInteraction<'cached'>,
      D
    >
  | BaseRegisterComponent<
      ComponentType.MentionableSelect,
      MentionableSelectMenuInteraction<'cached'>,
      D
    >;

export type RegisterModal<D extends CachedComponentData> = BaseComponentData<
  ComponentType.TextInput,
  ModalSubmitInteraction<'cached'>,
  D
> & { identifier?: string };

export type ModalInfo = Omit<RegisterModal<any>, 'identifier'>;
export type ComponentInfo = Omit<RegisterComponent<any>, 'identifier'>;
export interface ActiveComponentInfo {
  data: CachedComponentData;
  options: { ownerId: null | string };
}
