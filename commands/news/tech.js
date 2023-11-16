const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ActionRowBuilder,
  Colors,
} = require("discord.js");
const fetch = require("node-fetch");

let newsStackCount = 0;

const api = '<YOUR_NEWS_API>';
const funcName = "tech";
const funcDesc = "Retrieves Tech News";
const articleSubject = "technology";

async function getArticle(arrayInt, subject) {
  const response = await fetch(
    `https://newsapi.org/v2/top-headlines?country=us&category=${subject}&apiKey=${api}`
  );
  const data = await response.json();
  const { title, content, urlToImage: image } = data.articles[arrayInt];
  return { title, content, image };
}

module.exports = {
  data: new SlashCommandBuilder().setName(funcName).setDescription(funcDesc),

  async execute(interaction) {
    const newsEmbed = new EmbedBuilder()
      .setTitle("🔍 Searching....")
      .setDescription("Bot is still gathering data, Please Wait....")
      .setColor(Colors.Gold)
      .setFooter({
        text: `Current Page - ${newsStackCount}`,
      });

    const nextButton = new ButtonBuilder()
      .setCustomId("next-button")
      .setLabel("Next News 👉")
      .setStyle(ButtonStyle.Primary);

    const previousButton = new ButtonBuilder()
      .setCustomId("back-button")
      .setLabel("👈 Last News")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(
      previousButton,
      nextButton
    );

    const reply = await interaction.reply({
      content: "",
      embeds: [newsEmbed],
      components: [actionRow],
    });

    // First Paint
    getArticle(newsStackCount, articleSubject).then((result) => {
      updateEmbed(result);
      editReply();
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    async function updateEmbed(result) {
      newsEmbed
        .setTitle(result.title)
        .setDescription(result.content)
        .setImage(result.image)
        .setFooter({
          text: `Current Page - ${newsStackCount}`,
        });
    }

    async function editReply() {
      await reply.edit({
        content: "",
        embeds: [newsEmbed],
        components: [actionRow],
      });
    }

    function handleButtonPress(direction) {
      newsStackCount += direction;
      getArticle(newsStackCount, articleSubject).then((result) => {
        updateEmbed(result);
        editReply();
      });
    }

    collector.on("collect", (e) => {
      if (e.user.id !== interaction.user.id) {
        console.log("Unwanted Interaction");
        return;
      }

      if (e.customId === "next-button") {
        handleButtonPress(1);
      } else if (e.customId === "back-button") {
        handleButtonPress(-1);
      }
      e.deferUpdate();
    });

    collector.on("end", () => {
      newsEmbed
        .setTitle("Timed Out")
        .setDescription("Search query has been timed out by the bot")
        .setColor(Colors.Red)
        .setFooter({
          text: `/${funcName} to read news again!`,
        });
      previousButton.setDisabled(true);
      nextButton.setDisabled(true);
      editReply();
    });
  },
};
