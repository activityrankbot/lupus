import {
  type REST,
  type RESTPostAPIApplicationCommandsResult,
  Routes,
} from 'discord.js';
import { ComponentRegistry, Registry } from './index.js';
import { opendir } from 'node:fs/promises';
import { join as joinpath } from 'node:path';
import { fileURLToPath } from 'node:url';

export class RegistryHandle extends Registry {
  private componentRegistry: ComponentRegistry;
  constructor() {
    super();
    this.componentRegistry = new ComponentRegistry();
  }

  async walkDirectories(...dirs: PathLike[]) {
    for (const dir of dirs) {
      for await (const file of walk(dir)) {
        await import(file);
      }
    }
  }

  get commandPostBody() {
    return this.data.commandData.filter((d) => !d.admin).map((d) => d.body);
  }

  get allCommandPostBody() {
    return this.data.commandData.map((d) => d.body);
  }

  async loadGuildCommands(opts: {
    rest: REST;
    guildId: string;
    clientId: string;
    includeAdmin?: boolean;
  }) {
    const response = await opts.rest.post(
      Routes.applicationGuildCommands(opts.clientId, opts.guildId),
      {
        body: opts.includeAdmin
          ? this.allCommandPostBody
          : this.commandPostBody,
      }
    );
    return response as RESTPostAPIApplicationCommandsResult[];
  }

  async loadGlobalCommands(opts: { rest: REST; clientId: string }) {
    const response = await opts.rest.post(
      Routes.applicationCommands(opts.clientId),
      { body: this.commandPostBody }
    );
    return response as RESTPostAPIApplicationCommandsResult[];
  }
}

type PathLike = URL | string;

async function* walk(dir: PathLike): AsyncGenerator<string, void, void> {
  for await (const d of await opendir(dir)) {
    const entry = joinpath(fileURLToPath(dir), d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}
