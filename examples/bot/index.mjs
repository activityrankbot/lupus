import { Client, Events } from 'discord.js';
import { amber } from '../../../dist/index.js';

const handle = amber();
await handle.walkDirectories(new URL('./commands', import.meta.url));

const client = new Client({ intents: [] });

console.log(handle.allCommandPostBody);
console.log(handle.data);

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand() || interaction.isAutocomplete()) {
    return await handle.handleInteraction(interaction);
  }
});
