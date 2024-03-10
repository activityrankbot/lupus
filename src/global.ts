import { type Registry, RegistryHandle } from './index.js';
import type { ComponentRegistry } from './ComponentRegistry.js';

export let commands: Registry = null as unknown as Registry;
export let components: ComponentRegistry = null as unknown as ComponentRegistry;

export function amber() {
  return new RegistryHandle();
}

export function setSingletonCommands(value: Registry) {
  if (commands !== null)
    throw new Error('Attempted to double-set singleton `commands`');
  commands = value;
  return commands;
}

export function setSingletonComponents(value: ComponentRegistry) {
  if (components !== null)
    throw new Error('Attempted to double-set singleton `components`');
  components = value;
  return components;
}
