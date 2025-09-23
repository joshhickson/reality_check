const TITLES = [
    {
        name: "The Saint",
        description: "Highest virtue with minimal sin.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => p.stats.sin < 3 && !p.isExiled);
            if (eligible.length === 0) return null;
            return eligible.reduce((prev, current) => (prev.stats.virtue > current.stats.virtue) ? prev : current);
        }
    },
    {
        name: "The Hustler",
        description: "Maximum money while staying morally neutral.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => Math.abs(p.stats.sin - p.stats.virtue) <= 2 && !p.isExiled);
            if (eligible.length === 0) return null;
            return eligible.reduce((prev, current) => (prev.stats.money > current.stats.money) ? prev : current);
        }
    },
    {
        name: "The Survivor",
        description: "Highest mental health despite chaos.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => !p.isExiled);
            if (eligible.length === 0) return null;
            return eligible.reduce((prev, current) => (prev.stats.mentalHealth > current.stats.mentalHealth) ? prev : current);
        }
    },
    {
        name: "The Influencer",
        description: "Most positive impact on other players' outcomes.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => !p.isExiled);
            if (eligible.length === 0) return null;
            return eligible.reduce((prev, current) => (prev.stats.kudos > current.stats.kudos) ? prev : current);
        }
    }
];

module.exports = { TITLES };
