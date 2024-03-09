import { commands, components } from '../../../../dist/index.js';

const sc = commands.generateSubcommand({
  name: 'sub',
  execute: async (interaction) => {},
  autocomplete: async (interaction) => {},
  requiredPrivilegeLevel: 1,
});

commands.registerGroupedCommand({
  data: {
    name: 'root command',
    description: 'does root command things',
    options: [
      {
        type: commands.OptionType.SubcommandGroup,
        name: 'group',
        description: 'is group',
        options: [
          {
            type: commands.OptionType.Subcommand,
            name: 'sub',
            description: 'is subcmd',
          },
        ],
      },
    ],
  },
  requiredPrivilegeLevel: 5,
  groups: [{ name: 'group', subcommands: [sc] }],
});
