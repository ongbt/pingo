import { mutation } from "./_generated/server";

export const defaultSheets = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSheets = await ctx.db.query("sheet").filter((q) => q.eq(q.field("isDefault"), true)).collect();
    const existingTitles = new Set(existingSheets.map(s => s.title));

    if (!existingTitles.has("Corporate Townhall Bingo")) {
      await ctx.db.insert("sheet", {
        title: "Corporate Townhall Bingo",
        items: [
          "Synergy", "Alignment", "Deep dive", "Circle back", "Low hanging fruit",
          "Move the needle", "Paradigm shift", "Bandwidth", "Take it offline", "Ecosystem",
          "Stakeholder", "Win-win", "Best-in-class", "Touch base", "Game changer",
          "Value add", "Leverage", "Scalable", "Actionable", "Millennial",
          "Disruptive", "Core competency", "In the loop", "Roadmap", "Pivotal"
        ],
        isDefault: true,
        playCount: 0,
      });
    }

    if (!existingTitles.has("Zoo Animals")) {
      await ctx.db.insert("sheet", {
        title: "Zoo Animals",
        items: [
          "Lion", "Tiger", "Elephant", "Giraffe", "Zebra",
          "Gorilla", "Monkey", "Hippo", "Crocodile", "Penguin",
          "Flamingo", "Kangaroo", "Koala", "Panda", "Polar Bear",
          "Red Panda", "Sloth", "Otter", "Cheetah", "Rhino",
          "Ostrich", "Peacock", "Snow Leopard", "Meerkat", "Lemur",
          "Chimpanzee", "Orangutan", "Gibbon", "Wallaby", "Wombat"
        ],
        isDefault: true,
        playCount: 0,
      });
    }

    if (!existingTitles.has("Disneyland Characters")) {
      await ctx.db.insert("sheet", {
        title: "Disneyland Characters",
        items: [
          "Mickey Mouse", "Minnie Mouse", "Donald Duck", "Daisy Duck", "Goofy",
          "Pluto", "Cinderella", "Snow White", "Ariel", "Belle",
          "Jasmine", "Aurora", "Mulan", "Pocahontas", "Tiana",
          "Rapunzel", "Merida", "Elsa", "Anna", "Olaf",
          "Simba", "Timon", "Pumbaa", "Buzz Lightyear", "Woody",
          "Peter Pan", "Wendy", "Captain Hook", "Tinker Bell", "Alice"
        ],
        isDefault: true,
        playCount: 0,
      });
    }
  },
});
