import { commands, components } from '../../../dist/index.js';

commands.registerCommand({
  data: { name: 'ping', description: 'pings' },
  execute: async (int) => {
    int.reply('ping!');
  },
});

const button = components.registerComponent({
  type: components.Type.Button,
  callback({ data, interaction }) {
    interaction.reply({ content: `Data: ${data}` });
  },
});
