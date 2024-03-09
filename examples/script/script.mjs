import { REST } from 'discord.js';
import { amber } from '../../../src/index.js';

const handle = amber();
await handle.walkDirectories(new URL('./commands', import.meta.url));

const rest = new REST().setToken('t');
await handle.loadGuildCommands({ rest, clientId: '', guildId: '' });
