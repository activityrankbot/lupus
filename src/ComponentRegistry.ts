import { setSingletonComponents } from './index.js';
import { nanoid } from 'nanoid';
import {
  ActiveComponentInfo,
  CachedComponentData,
  ComponentInfo,
  ModalInfo,
  RegisterComponent,
  RegisterModal,
} from './util/types/components.js';
import { Time } from '@sapphire/duration';
import {
  ComponentType,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { ComponentHandleError, HandleError } from './util/errors.js';

enum ComponentKey {
  Throw = 'amber-handler::__THROW__',
  Ignore = 'amber-handler::__IGNORE__',
}

export class ComponentRegistry {
  static PREFIX = 'amber-handler::';
  static ComponentKey = ComponentKey;

  public VERSION: string | number;

  // re-export
  Type = ComponentType;

  constructor(opts?: { VERSION?: string | number }) {
    this.VERSION = opts?.VERSION?.toString() ?? '';
    return setSingletonComponents(this);
  }

  protected data: RegistryData = {
    components: new Map(),
    modals: new Map(),
    activeComponents: new Map(),
  };

  registerComponent<D extends CachedComponentData = void>(
    meta: RegisterComponent<D>
  ) {
    // unique per-component _type_ identifier. Not unique per component _sent_.
    // if provided, it's the developer's responsibility to ensure its uniqueness.
    // Identifiers may not contain periods.
    // For instance, `config-role|menu|launchmodal` would be appropriate.
    const identifier = meta.identifier ?? nanoid(20);
    this.data.components.set(identifier, meta);

    // logger.debug(`Loaded component ${identifier}`);

    return this.buildCustomIdBuilder<D>(identifier);
  }

  registerModal<D extends CachedComponentData = void>(meta: RegisterModal<D>) {
    // unique per-modal _type_ identifier. Not unique per modal _sent_.
    // if provided, it's the developer's responsibility to ensure its uniqueness.
    // Identifiers may not contain periods.
    // For instance, `config-role|menu|modal` would be appropriate.
    const identifier = meta.identifier ?? nanoid(20);
    this.data.modals.set(identifier, meta);

    // logger.debug(`Loaded modal component ${identifier}`);

    return this.buildCustomIdBuilder<D>(identifier);
  }

  private buildCustomIdBuilder<D extends CachedComponentData>(
    identifier: string
  ) {
    const makeCustomId = (
      data: D,
      options?: { ownerId?: string; timeout?: number; instanceId?: string }
    ) => {
      const instanceId = options?.instanceId ?? nanoid(20);

      this.data.activeComponents.set(instanceId, {
        data,
        options: { ownerId: options?.ownerId ?? null },
      });

      setTimeout(
        () => this.data.activeComponents.delete(instanceId),
        options?.timeout ?? Time.Minute * 30
      );

      return [
        ComponentRegistry.PREFIX,
        this.VERSION,
        identifier,
        instanceId,
      ].join('.');
    };
    return makeCustomId;
  }

  getCustomIdDropper =
    (interaction: MessageComponentInteraction | ModalSubmitInteraction) => () =>
      this.data.activeComponents.delete(interaction.customId.split('.')[1]);

  splitCustomId(
    interaction: MessageComponentInteraction | ModalSubmitInteraction
  ) {
    const [prefix, version, identifier, instance] =
      interaction.customId.split('.');
    return { prefix, version, identifier, instance };
  }

  async handleComponentInteraction(interaction: MessageComponentInteraction) {
    if (!interaction.inCachedGuild()) {
      throw new HandleError({
        name: 'GUILD_NOT_CACHED',
        message: 'An interaction was used in an uncached guild.',
      });
    }

    const { prefix, version, identifier, instance } =
      this.splitCustomId(interaction);
    if (prefix !== ComponentRegistry.PREFIX) return;
    if (interaction.customId === ComponentKey.Ignore) return;
    if (interaction.customId === ComponentKey.Throw) {
      throw new ComponentHandleError({
        name: 'THROW_COMPONENT_TRIGGERED',
        message:
          'A component with the ID associated with `ComponentKey.Throw` was activated',
      });
    }

    if (version !== this.VERSION) {
      throw new ComponentHandleError({
        name: 'OUTDATED_COMPONENT_TRIGGERED',
        message: `A component with an old version component ("${version}") was triggered. Current version: "${this.VERSION}"`,
      });
    }

    const ref = this.data.components.get(identifier);

    if (!ref) {
      throw new ComponentHandleError({
        name: 'COMPONENT_NOT_FOUND',
        message: `Failed to find a registered component with the identifier "${identifier}".`,
      });
    }

    const data = this.data.activeComponents.get(instance);
    if (!data) {
      throw new ComponentHandleError({
        name: 'INSTANCE_NOT_FOUND',
        message: `Failed to find an instance "${instance}" of a component with the identifier "${identifier}".`,
      });
    }

    if (data.options.ownerId && interaction.user.id !== data.options.ownerId) {
      throw new ComponentHandleError({
        name: 'DISALLOWED_USER',
        message:
          'This user does not have the correct ID to activate the component',
      });
    }

    const dropCustomId = this.getCustomIdDropper(interaction);
    try {
      // `interaction` is expected to be only one of Interaction subtypes.
      // We skip validating the component type because it should be impossible
      // to recive an invalid type.
      // @ts-expect-error
      await ref.callback({ interaction, data: data.data, dropCustomId });
    } catch (cause) {
      throw new ComponentHandleError({
        name: 'COMPONENT_THROWN',
        message: `Component with ID ${interaction.customId} threw an error while executing`,
        cause,
      });
    }
  }

  async handleModalInteraction(interaction: ModalSubmitInteraction) {
    if (!interaction.inCachedGuild()) {
      throw new HandleError({
        name: 'GUILD_NOT_CACHED',
        message: 'An interaction was used on an uncached guild.',
      });
    }

    const { prefix, version, identifier, instance } =
      this.splitCustomId(interaction);

    if (prefix !== ComponentRegistry.PREFIX) return;

    if (version !== this.VERSION) {
      throw new ComponentHandleError({
        name: 'OUTDATED_COMPONENT_TRIGGERED',
        message: `A modal with an old version component ("${version}") was triggered. Current version: "${this.VERSION}"`,
      });
    }

    const ref = this.data.modals.get(identifier);

    if (!ref) {
      throw new ComponentHandleError({
        name: 'COMPONENT_NOT_FOUND',
        message: `Failed to find a registered modal with the identifier "${identifier}".`,
      });
    }

    const data = this.data.activeComponents.get(instance);
    if (!data) {
      throw new ComponentHandleError({
        name: 'INSTANCE_NOT_FOUND',
        message: `Failed to find an instance "${instance}" of a modal with the identifier "${identifier}".`,
      });
    }

    if (data.options.ownerId && interaction.user.id !== data.options.ownerId) {
      throw new ComponentHandleError({
        name: 'DISALLOWED_USER',
        message: 'This user does not have the correct ID to activate the modal',
      });
    }

    const dropCustomId = this.getCustomIdDropper(interaction);
    try {
      await ref.callback({ interaction, data: data.data, dropCustomId });
    } catch (cause) {
      throw new ComponentHandleError({
        name: 'COMPONENT_THROWN',
        message: `Component with ID ${interaction.customId} threw an error while executing`,
        cause,
      });
    }
  }
}

interface RegistryData {
  components: Map<string, ComponentInfo>;
  modals: Map<string, ModalInfo>;
  activeComponents: Map<string, ActiveComponentInfo>;
}
