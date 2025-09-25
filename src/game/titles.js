const TITLES = [
    // --- Core Financial Titles ---
    {
        name: "The Capitalist",
        description: "Finished with the most money.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.money > max.stats.money ? p : max, players[0])
    },
    {
        name: "The Penny Pincher",
        description: "Finished with high money and low sin.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => p.stats.money > 25000 && p.stats.sin < 5);
            if (eligible.length === 0) return null;
            return eligible.reduce((max, p) => p.stats.money > max.stats.money ? p : max, eligible[0]);
        }
    },
    {
        name: "The Debtor",
        description: "Finished with the least money.",
        isAwardedTo: (players) => players.reduce((min, p) => p.stats.money < min.stats.money ? p : min, players[0])
    },

    // --- Moral Compass Titles ---
    {
        name: "The Saint",
        description: "Finished with the highest virtue.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.virtue > max.stats.virtue ? p : max, players[0])
    },
    {
        name: "The Sinner",
        description: "Finished with the most sin.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.sin > max.stats.sin ? p : max, players[0])
    },
    {
        name: "The Purest Soul",
        description: "Finished with the highest virtue and zero sin.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => p.stats.sin === 0);
            if (eligible.length === 0) return null;
            return eligible.reduce((max, p) => p.stats.virtue > max.stats.virtue ? p : max, eligible[0]);
        }
    },
    {
        name: "The Utilitarian",
        description: "Finished with a balance of high virtue and high sin.",
         isAwardedTo: (players) => {
            const eligible = players.filter(p => p.stats.virtue > 10 && p.stats.sin > 10);
            if (eligible.length === 0) return null;
            return eligible.reduce((max, p) => (p.stats.virtue + p.stats.sin) > (max.stats.virtue + max.stats.sin) ? p : max, eligible[0]);
        }
    },

    // --- Mental Health & Burnout Titles ---
    {
        name: "The Survivor",
        description: "Finished with the highest mental health.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.mentalHealth > max.stats.mentalHealth ? p : max, players[0])
    },
    {
        name: "The Martyr",
        description: "Finished with the lowest mental health but highest virtue.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => p.stats.mentalHealth < 4);
            if (eligible.length === 0) return null;
            return eligible.reduce((max, p) => p.stats.virtue > max.stats.virtue ? p : max, eligible[0]);
        }
    },
    {
        name: "The Burned Out",
        description: "Was in 'Burnout' status at the end of the game.",
        isAwardedTo: (players) => players.find(p => p.isBurnedOut) || null
    },

    // --- Social & Influence Titles ---
    {
        name: "The Influencer",
        description: "Received the most 'Kudos' tokens.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.kudos > max.stats.kudos ? p : max, players[0])
    },
    {
        name: "The Pariah",
        description: "Received the most 'Concern' tokens.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.concern > max.stats.concern ? p : max, players[0])
    },
    {
        name: "The Socialite",
        description: "Finished with the most Social Capital.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.socialCapital > max.stats.socialCapital ? p : max, players[0])
    },
    {
        name: "The Community Builder",
        description: "Had the highest Community Impact score.",
        isAwardedTo: (players) => players.reduce((max, p) => p.stats.communityImpact > max.stats.communityImpact ? p : max, players[0])
    },

    // --- Gameplay Style Titles ---
    {
        name: "The Workhorse",
        description: "Used the 'Work Overtime' action the most.",
        // This would require tracking action counts. Placeholder for now.
        isAwardedTo: (players) => null
    },
    {
        name: "The Storyteller",
        description: "Triggered the most 'Life Happens' events.",
        // This would require tracking event counts. Placeholder for now.
        isAwardedTo: (players) => null
    },
    {
        name: "The Gambler",
        description: "Took the most high-risk, high-reward choices.",
        // This would require tracking choice metadata. Placeholder for now.
        isAwardedTo: (players) => null
    },
    {
        name: "The Cautious",
        description: "Avoided sin and risky choices all game.",
        isAwardedTo: (players) => {
            const eligible = players.filter(p => p.stats.sin < 2);
            if (eligible.length === 0) return null;
            return eligible.reduce((min, p) => p.stats.money < min.stats.money ? p : min, eligible[0]);
        }
    },

    // --- Miscellaneous & Fun Titles ---
    {
        name: "The Drama Queen",
        description: "Experienced the most Crossroads events.",
        // This would require tracking event counts. Placeholder for now.
        isAwardedTo: (players) => null
    },
    {
        name: "The Middle Child",
        description: "Finished with stats closest to the average in all categories.",
         isAwardedTo: (players) => {
            const avgMoney = players.reduce((sum, p) => sum + p.stats.money, 0) / players.length;
            const avgVirtue = players.reduce((sum, p) => sum + p.stats.virtue, 0) / players.length;
            const avgSin = players.reduce((sum, p) => sum + p.stats.sin, 0) / players.length;

            let minDiff = Infinity;
            let winner = null;
            players.forEach(p => {
                const diff = Math.abs(p.stats.money - avgMoney) + Math.abs(p.stats.virtue - avgVirtue) + Math.abs(p.stats.sin - avgSin);
                if (diff < minDiff) {
                    minDiff = diff;
                    winner = p;
                }
            });
            return winner;
        }
    },
    {
        name: "The Rollercoaster",
        description: "Had the widest swing in Mental Health during the game.",
        // This would require tracking stat history. Placeholder for now.
        isAwardedTo: (players) => null
    }
];

module.exports = { TITLES };