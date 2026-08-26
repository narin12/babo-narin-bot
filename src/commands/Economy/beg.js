import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { botConfig } from '../../config/bot.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const COOLDOWN = 30 * 60 * 1000;
const MIN_WIN = Number(botConfig?.economy?.begMin) || 50;
const MAX_WIN = Number(botConfig?.economy?.begMax) || 200;
const SUCCESS_CHANCE = 0.7;

export default {
    data: new SlashCommandBuilder()
        .setName('바보 나린이에게 구걸하기')
        .setDescription('바보 나린이에게 구걸을해서 돈이 생겼어요! -# 대신 빚도 생겼지만...'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
            const userId = interaction.user.id;
            const guildId = interaction.guildId;

            let userData = await getEconomyData(client, guildId, userId);
            
            if (!userData) {
                throw createError(
                    "로딩하는데 실패했어요!",
                    ErrorTypes.DATABASE,
                    "로딩하는데 실패했어요! 조금만 더 기다려주세요! (지갑 주섬주섬..)",
                    { userId, guildId }
                );
            }

            const lastBeg = userData.lastBeg || 0;
            const remainingTime = lastBeg + COOLDOWN - Date.now();

            if (remainingTime > 0) {
                const minutes = Math.floor(remainingTime / 60000);
                const seconds = Math.floor((remainingTime % 60000) / 1000);

                let timeMessage =
                    minutes > 0 ? `${minutes} minute(s)` : `${seconds} second(s)`;

                throw createError(
                    "조금만 더 기다려주세요 돈이 없어요 ㅠㅠ",
                    ErrorTypes.RATE_LIMIT,
                    `You are tired from begging! Try again in **${timeMessage}**.`,
                    { remainingTime, minutes, seconds, cooldownType: '바보 나린이에게 구걸하기' }
                );
            }

            const success = Math.random() < SUCCESS_CHANCE;

            let replyEmbed;
            let newCash = userData.wallet;

            if (success) {
                const amountWon =
                    Math.floor(Math.random() * (MAX_WIN - MIN_WIN + 1)) + MIN_WIN;

                newCash += amountWon;

                const successMessages = [
                    `A kind stranger drops **$${amountWon.toLocaleString()}** into your cup.`,
                    `You spotted an unattended wallet! You grab **$${amountWon.toLocaleString()}** and run.`,
                    `Someone took pity on you and gave you **$${amountWon.toLocaleString()}**!`,
                    `You found **$${amountWon.toLocaleString()}** under a park bench.`,
                ];

                replyEmbed = successEmbed(
                    '자 여기요! 대신 함부로 쓰지말아요! 함부로 쓰면 당신에게 바보나린의 빚이 생길테니까요!',
                    successMessages[
                        Math.floor(Math.random() * successMessages.length)
                    ]
                );
            } else {
                const failMessages = [
                    "The police chased you off. You got nothing.",
                    "Someone yelled, 'Get a job!' and walked past.",
                    "A squirrel stole the single coin you had.",
                    "You tried to beg, but you were too embarrassed and gave up.",
                ];

                replyEmbed = warningEmbed(
                    'Insufficient Funds',
                    failMessages[Math.floor(Math.random() * failMessages.length)]
                );
            }

            userData.wallet = newCash;
userData.lastBeg = Date.now();

            await setEconomyData(client, guildId, userId, userData);

            await InteractionHelper.safeEditReply(interaction, { embeds: [replyEmbed] });
    }, { command: '바보나린이에게 구걸하기' })
};
