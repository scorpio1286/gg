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
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`✅ VIPERZ SMP Whitelist Bot active as ${client.user.tag}`);
});

// Admin Command to post the permanent registration panel in a channel
client.on('messageCreate', async (message) => {
  if (message.content === '!setup-whitelist' && message.member.permissions.has('Administrator')) {
    const embed = new EmbedBuilder()
      .setTitle('🐍 VIPERZ SMP — Squad Whitelist Registration')
      .setDescription('Click the button below to register your 4-player team for the VIPERZ SMP!')
      .setColor(0x00FF7F);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_registration_modal')
        .setLabel('📝 Register Squad')
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// Interaction Handling (Buttons & Modals)
client.on('interactionCreate', async (interaction) => {
  
  // 1. When user clicks "Register Squad" Button
  if (interaction.isButton() && interaction.customId === 'open_registration_modal') {
    const modal = new ModalBuilder()
      .setCustomId('squad_modal_form')
      .setTitle('VIPERZ SMP Squad Form');

    const teamNameInput = new TextInputBuilder()
      .setCustomId('team_name')
      .setLabel('Team Name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const leaderInput = new TextInputBuilder()
      .setCustomId('p1_info')
      .setLabel('Player 1 (Leader) - IGN & Discord')
      .setPlaceholder('IGN: Steve | Tag: @LeaderTag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p2Input = new TextInputBuilder()
      .setCustomId('p2_info')
      .setLabel('Player 2 - IGN & Discord')
      .setPlaceholder('IGN: Alex | Tag: @P2Tag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p3Input = new TextInputBuilder()
      .setCustomId('p3_info')
      .setLabel('Player 3 - IGN & Discord')
      .setPlaceholder('IGN: Notch | Tag: @P3Tag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const p4Input = new TextInputBuilder()
      .setCustomId('p4_info')
      .setLabel('Player 4 - IGN & Discord')
      .setPlaceholder('IGN: Herobrine | Tag: @P4Tag')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(teamNameInput),
      new ActionRowBuilder().addComponents(leaderInput),
      new ActionRowBuilder().addComponents(p2Input),
      new ActionRowBuilder().addComponents(p3Input),
      new ActionRowBuilder().addComponents(p4Input)
    );

    // Show modal immediately (0 ms response latency)
    await interaction.showModal(modal);
  }

  // 2. When user submits the Modal Form
  if (interaction.isModalSubmit() && interaction.customId === 'squad_modal_form') {
    await interaction.deferReply({ ephemeral: true });

    const teamName = interaction.fields.getTextInputValue('team_name');
    const p1 = interaction.fields.getTextInputValue('p1_info');
    const p2 = interaction.fields.getTextInputValue('p2_info');
    const p3 = interaction.fields.getTextInputValue('p3_info');
    const p4 = interaction.fields.getTextInputValue('p4_info');

    const embed = new EmbedBuilder()
      .setTitle(`🐍 VIPERZ SMP Squad Submission — ${teamName}`)
      .setColor(0x00FF7F)
      .addFields(
        { name: '🛡️ Team Name', value: teamName, inline: false },
        { name: '👑 Player 1 (Leader)', value: p1, inline: true },
        { name: '⚔️ Player 2', value: p2, inline: true },
        { name: '⚔️ Player 3', value: p3, inline: true },
        { name: '⚔️ Player 4', value: p4, inline: true },
        { name: '📋 Rules Agreement', value: '✅ Accepted upon modal submission', inline: false }
      )
      .setFooter({ text: 'VIPERZ SMP Whitelist System' })
      .setTimestamp();

    try {
      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          content: `📥 **New Whitelist Submission by ${interaction.user}**`,
          embeds: [embed]
        });
      }
      await interaction.editReply({ content: '✅ Squad registration submitted successfully!' });
    } catch (err) {
      console.error('Error logging submission:', err);
      await interaction.editReply({ content: '⚠️ Submission recorded, but failed to post to log channel. Check LOG_CHANNEL_ID.' });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
