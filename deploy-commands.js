// deploy-commands.js
require('dotenv').config({ path: './cfg.env' });
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'invites',
    description: 'Check the number of invites a user has',
    options: [
      {
        name: 'user',
        type: ApplicationCommandOptionType.User,
        description: 'The user to check',
        required: true,
      },
    ],
  },
  {
    name: 'setup',
    description: 'Setup the role to be assigned when users get invites',
    options: [
      {
        name: 'role',
        type: ApplicationCommandOptionType.Role,
        description: 'The role to assign',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
