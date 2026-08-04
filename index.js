const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ VIPERZ SMP Whitelist Bot active as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'register-squad') {
    const user = interaction.user;

    try {
      const dmChannel = await user.createDM();
      await interaction.reply({ 
        content: '📬 Check your Direct Messages to fill out the team registration form!', 
        ephemeral: true 
      });

      const askQuestion = async (queryText) => {
        await dmChannel.send(queryText);
        const collected = await dmChannel.awaitMessages({
          filter: m => m.author.id === user.id,
          max: 1,
          time: 300000, // 5 minute timeout per response
          errors: ['time']
        });
        return collected.first().content.trim();
      };

      await dmChannel.send('🐍 **VIPERZ SMP — Squad Whitelist Registration**\nPlease answer the questions below to register your 4-player team.');

      // 1. Team Name
      const teamName = await askQuestion('📌 **What is your Team Name?**');

      // 2. Collect Player Details
      const players = [];

      for (let i = 1; i <= 4; i++) {
        const roleLabel = i === 1 ? 'Player 1 (Team Leader)' : `Player ${i}`;
        await dmChannel.send(`\n--- **${roleLabel} Details** ---`);
        
        const ign = await askQuestion(`🎮 Enter **${roleLabel}'s Minecraft IGN**:`);
        const discordTag = await askQuestion(`🏷️ Enter **${roleLabel}'s Discord Mention or Tag** (e.g., @User):`);
        const role = await askQuestion(`⚔️ Enter **${roleLabel}'s Primary Role** (e.g., Builder, PVPer, Redstoner):`);

        players.push({ ign, discordTag, role, index: i });
      }

      // 3. Rules Agreement
      const agreementRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('accept_rules')
          .setLabel('I Agree & Confirm')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('decline_rules')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
      );

      const agreementMsg = await dmChannel.send({
        content: '📜 **Server Agreement**:\nDo you and your team agree to follow all VIPERZ SMP server rules and attend the official launch gathering?',
        components: [agreementRow]
      });

      const buttonInteraction = await agreementMsg.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 60000
      });

      if (buttonInteraction.customId === 'decline_rules') {
        await buttonInteraction.reply('❌ Registration cancelled.');
        return;
      }

      await buttonInteraction.reply('✅ Registration submitted successfully! Staff will process your whitelist.');

      // 4. Submission Embed
      const embed = new EmbedBuilder()
        .setTitle(`🐍 VIPERZ SMP Squad Whitelist Submission — ${teamName}`)
        .setColor(0x00FF7F)
        .addFields(
          { name: '🛡️ Team Name', value: teamName, inline: true },
          { name: '👑 Leader Mention', value: players[0].discordTag, inline: true },
          { name: '\u200B', value: '\u200B', inline: false }
        )
        .setFooter({ text: 'VIPERZ SMP Whitelist System' })
        .setTimestamp();

      players.forEach((p) => {
        embed.addFields({
          name: `Player ${p.index} ${p.index === 1 ? '(Leader)' : ''}`,
          value: `**IGN:** \`${p.ign}\`\n**Discord:** ${p.discordTag}\n**Role:** ${p.role}`,
          inline: true
        });
      });

      embed.addFields({
        name: '📋 Rules & Gathering Agreement',
        value: '✅ Accepted by Team Leader',
        inline: false
      });

      // 5. In-Game Commands Block
      const whitelistCommands = players.map(p => `whitelist add ${p.ign}`).join('\n');

      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          content: `📥 **New Registration Submitted by ${user}**\n\`\`\`bash\n# Minecraft Whitelist Commands\n${whitelistCommands}\n\`\`\``,
          embeds: [embed]
        });
      }

    } catch (err) {
      console.error(err);
      await user.send('⚠️ Registration timed out or failed. Please run `/register-squad` again in the server.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
