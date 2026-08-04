const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`===========================================`);
  console.log(`✅ VIPERZ SMP Bot Online: ${client.user.tag}`);
  console.log(`===========================================`);
});

// 1. ADMIN COMMAND TO POST REGISTRATION PANEL IN CHANNEL
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Type !setup in the target whitelist channel
  if (message.content.toLowerCase() === '!setup') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Only administrators can run this setup command.');
    }

    // Delete the !setup message to keep the channel clean
    await message.delete().catch(() => {});

    const setupEmbed = new EmbedBuilder()
      .setTitle('🐍 VIPERZ SMP — SQUAD WHITELIST REGISTRATION')
      .setDescription(
        '@everyone\n\n' +
        'Welcome to **VIPERZ SMP**! Squad registrations are officially open.\n\n' +
        '**Registration Rules:**\n' +
        '• Teams must consist of **4 players**.\n' +
        '• Provide accurate Minecraft IGNs for all members.\n' +
        '• By registering, your team agrees to follow all server rules and attend the official launch gathering.\n\n' +
        'Click the **📝 Register Squad** button below to submit your team!'
      )
      .setColor(0x00FF7F)
      .setFooter({ text: 'VIPERZ SMP Official Whitelist System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_squad_modal')
        .setLabel('📝 Register Squad')
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      embeds: [setupEmbed],
      components: [row]
    });
  }
});

// 2. INTERACTION HANDLING (BUTTON CLICK & MODAL SUBMISSION)
client.on('interactionCreate', async (interaction) => {
  
  // A. USER CLICKS "REGISTER SQUAD" BUTTON
  if (interaction.isButton() && interaction.customId === 'btn_open_squad_modal') {
    const modal = new ModalBuilder()
      .setCustomId('modal_squad_registration')
      .setTitle('VIPERZ SMP Squad Whitelist Form');

    const teamNameInput = new TextInputBuilder()
      .setCustomId('input_team_name')
      .setLabel('Team Name')
      .setPlaceholder('Enter your squad name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p1Input = new TextInputBuilder()
      .setCustomId('input_p1')
      .setLabel('Player 1 (Leader) - IGN & Discord')
      .setPlaceholder('Format: IGN | @DiscordTag (e.g., Steve | @Leader)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p2Input = new TextInputBuilder()
      .setCustomId('input_p2')
      .setLabel('Player 2 - IGN & Discord')
      .setPlaceholder('Format: IGN | @DiscordTag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p3Input = new TextInputBuilder()
      .setCustomId('input_p3')
      .setLabel('Player 3 - IGN & Discord')
      .setPlaceholder('Format: IGN | @DiscordTag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p4Input = new TextInputBuilder()
      .setCustomId('input_p4')
      .setLabel('Player 4 - IGN & Discord')
      .setPlaceholder('Format: IGN | @DiscordTag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(teamNameInput),
      new ActionRowBuilder().addComponents(p1Input),
      new ActionRowBuilder().addComponents(p2Input),
      new ActionRowBuilder().addComponents(p3Input),
      new ActionRowBuilder().addComponents(p4Input)
    );

    // Pops up instantly with zero Discord API latency delay
    await interaction.showModal(modal);
  }

  // B. USER SUBMITS THE MODAL FORM
  if (interaction.isModalSubmit() && interaction.customId === 'modal_squad_registration') {
    await interaction.deferReply({ ephemeral: true });

    const teamName = interaction.fields.getTextInputValue('input_team_name');
    const p1Data = interaction.fields.getTextInputValue('input_p1');
    const p2Data = interaction.fields.getTextInputValue('input_p2');
    const p3Data = interaction.fields.getTextInputValue('input_p3');
    const p4Data = interaction.fields.getTextInputValue('input_p4');

    // Extract potential IGNs for automated whitelist command output
    const extractIGN = (text) => text.split('|')[0].trim();
    const ign1 = extractIGN(p1Data);
    const ign2 = extractIGN(p2Data);
    const ign3 = extractIGN(p3Data);
    const ign4 = extractIGN(p4Data);

    const submissionEmbed = new EmbedBuilder()
      .setTitle(`🐍 VIPERZ SMP — Squad Registration: ${teamName}`)
      .setColor(0x00FF7F)
      .addFields(
        { name: '🛡️ Team Name', value: teamName, inline: false },
        { name: '👑 Player 1 (Leader)', value: p1Data, inline: true },
        { name: '⚔️ Player 2', value: p2Data, inline: true },
        { name: '⚔️ Player 3', value: p3Data, inline: true },
        { name: '⚔️ Player 4', value: p4Data, inline: true },
        { name: '📋 Rules & Gathering Agreement', value: '✅ Accepted by Team Leader upon submission', inline: false }
      )
      .setFooter({ text: `Submitted by ${interaction.user.tag}` })
      .setTimestamp();

    const whitelistCommands = `whitelist add ${ign1}\nwhitelist add ${ign2}\nwhitelist add ${ign3}\nwhitelist add ${ign4}`;

    try {
      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          content: `📥 **New Registration Received from ${interaction.user}**\n\`\`\`bash\n# Minecraft Console Whitelist Commands\n${whitelistCommands}\n\`\`\``,
          embeds: [submissionEmbed]
        });
      }
      await interaction.editReply({ 
        content: '✅ **Squad registration submitted successfully!** Staff will process your whitelist shortly.' 
      });
    } catch (err) {
      console.error('Failed to post to LOG_CHANNEL_ID:', err);
      await interaction.editReply({ 
        content: '⚠️ **Submission received**, but could not post to the log channel. Please check `LOG_CHANNEL_ID`.' 
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
