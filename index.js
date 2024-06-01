// index.js
require('dotenv').config({ path: './cfg.env' });
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const Invite = require('./models/Invite');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers] });

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.guilds.cache.forEach(guild => {
    guild.invites.fetch().then(invites => {
      invites.forEach(invite => {
        Invite.findOneAndUpdate(
          { userID: invite.inviter.id },
          { $set: { invites: invite.uses } },
          { upsert: true }
        ).exec();
      });
    });
  });
});

client.on('inviteCreate', async invite => {
  const inviter = await Invite.findOne({ userID: invite.inviter.id });
  if (inviter) {
    inviter.invites++;
    await inviter.save();
  } else {
    await Invite.create({ userID: invite.inviter.id, invites: 1 });
  }
});

client.on('inviteDelete', async invite => {
  const inviter = await Invite.findOne({ userID: invite.inviter.id });
  if (inviter && inviter.invites > 0) {
    inviter.invites--;
    await inviter.save();
  }
});

client.on('guildMemberAdd', async member => {
  const invites = await member.guild.invites.fetch();
  const inviter = invites.find(inv => inv.uses > (await Invite.findOne({ userID: inv.inviter.id }).invites || 0));

  if (inviter) {
    const userInvites = await Invite.findOne({ userID: inviter.inviter.id });
    userInvites.invites++;
    await userInvites.save();

    if (userInvites.invites >= 1) {
      const role = member.guild.roles.cache.find(role => role.name === 'drops');
      const user = await member.guild.members.fetch(inviter.inviter.id);
      if (role) user.roles.add(role);
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'invites') {
    const user = options.getUser('user');
    const invite = await Invite.findOne({ userID: user.id });
    const inviteCount = invite ? invite.invites : 0;
    await interaction.reply(`${user.username} has ${inviteCount} invites.`);
  }

  if (commandName === 'setup') {
    const role = options.getRole('role');
    await interaction.reply(`Setup complete. Users with 1+ invites will receive the ${role.name} role.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
