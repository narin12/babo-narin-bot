import { SlashCommandBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { joinVoiceChannel, replyMusicSuccess } from '../../services/music/musicActions.js';
import { deferMusicCommand } from '../../services/music/prefixSupport.js';

export default {
    category: '음악',
    data: new SlashCommandBuilder()
        .setName('입장')
        .setDescription('Join your voice channel without starting playback'),

    async execute(interaction, config, client) {
        const deferred = await deferMusicCommand(interaction);
        if (!deferred) {
            return;
        }

        const embed = await joinVoiceChannel(client, interaction);
        await replyMusicSuccess(interaction, embed);
    },
};
