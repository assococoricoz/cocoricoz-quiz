export const QUESTION_TIME = 20;

export const QUESTIONS_FR = [
  // 🏛️ Histoire
  { id: 0, category: "🏛️ Histoire", question: "Quel roi de France fut surnommé « le Roi-Soleil » ?", options: ["Louis XIII", "Louis XIV", "Henri IV", "François Ier"], correct: 1 },
  { id: 1, category: "🏛️ Histoire", question: "En quelle année la France a-t-elle définitivement aboli l'esclavage ?", options: ["1794", "1815", "1848", "1905"], correct: 2 },
  { id: 2, category: "🏛️ Histoire", question: "Quel traité a mis fin à la Première Guerre mondiale ?", options: ["Traité de Paris", "Traité de Versailles", "Traité de Westphalie", "Traité de Vienne"], correct: 1 },
  { id: 3, category: "🏛️ Histoire", question: "Qui était président de la République lors des événements de mai 1968 ?", options: ["Georges Pompidou", "Valéry Giscard d'Estaing", "Charles de Gaulle", "François Mitterrand"], correct: 2 },
  { id: 4, category: "🏛️ Histoire", question: "Quel empire français a duré de 1852 à 1870 ?", options: ["Premier Empire", "Second Empire", "Empire Colonial", "Empire Napoléonien"], correct: 1 },

  // 📚 Littérature
  { id: 5, category: "📚 Littérature", question: "Quel est le premier mot du roman « L'Étranger » d'Albert Camus ?", options: ["Hier", "Aujourd'hui", "Maman", "Il"], correct: 2 },
  { id: 6, category: "📚 Littérature", question: "Quel prix Nobel de littérature français a refusé le prix en 1964 ?", options: ["Albert Camus", "André Gide", "Jean-Paul Sartre", "François Mauriac"], correct: 2 },
  { id: 7, category: "📚 Littérature", question: "De quelle région est originaire Cyrano de Bergerac, le personnage d'Edmond Rostand ?", options: ["Gascogne", "Normandie", "Bretagne", "Bourgogne"], correct: 0 },
  { id: 8, category: "📚 Littérature", question: "Quel auteur a écrit la série « À la recherche du temps perdu » ?", options: ["Gustave Flaubert", "Émile Zola", "Marcel Proust", "Stendhal"], correct: 2 },

  // 🎵 Musique
  { id: 9, category: "🎵 Musique", question: "Qui a composé la « Symphonie Fantastique » ?", options: ["Camille Saint-Saëns", "Hector Berlioz", "Claude Debussy", "Maurice Ravel"], correct: 1 },
  { id: 10, category: "🎵 Musique", question: "Quel chanteur français est surnommé « Le Grand Barde » ?", options: ["Charles Aznavour", "Gilbert Bécaud", "Georges Brassens", "Jacques Brel"], correct: 2 },
  { id: 11, category: "🎵 Musique", question: "Quel opéra de Bizet raconte l'histoire d'une cigarière espagnole ?", options: ["Faust", "Manon", "Carmen", "Pelléas et Mélisande"], correct: 2 },

  // 🎬 Cinéma
  { id: 12, category: "🎬 Cinéma", question: "Quel réalisateur français a fondé la « Nouvelle Vague » avec « À bout de souffle » ?", options: ["François Truffaut", "Jean-Luc Godard", "Claude Chabrol", "Éric Rohmer"], correct: 1 },
  { id: 13, category: "🎬 Cinéma", question: "Quel acteur français a joué dans « Intouchables » aux côtés de François Cluzet ?", options: ["Omar Sy", "Dany Boon", "Jamel Debbouze", "Gad Elmaleh"], correct: 0 },
  { id: 14, category: "🎬 Cinéma", question: "Dans quel film entend-on la réplique « La vie c'est comme une boîte de chocolats » — en version française ?", options: ["Good Will Hunting", "Forrest Gump", "Rain Man", "Big"], correct: 1 },

  // 🗳️ Politique & Institutions
  { id: 15, category: "🗳️ Politique", question: "Qui a fondé la Ve République française ?", options: ["Georges Pompidou", "Charles de Gaulle", "Vincent Auriol", "René Coty"], correct: 1 },
  { id: 16, category: "🗳️ Politique", question: "Combien d'articles compte la Constitution française de 1958 ?", options: ["67", "89", "104", "121"], correct: 1 },
  { id: 17, category: "🗳️ Politique", question: "Quelle est la devise officielle de la République française ?", options: ["Égalité, Fraternité, Justice", "Liberté, Égalité, Fraternité", "Liberté, Justice, Paix", "Unité, Égalité, Progrès"], correct: 1 },

  // 🗺️ Géographie
  { id: 18, category: "🗺️ Géographie", question: "Quelle est la région française la plus grande en superficie ?", options: ["Occitanie", "Grand Est", "Nouvelle-Aquitaine", "Auvergne-Rhône-Alpes"], correct: 2 },
  { id: 19, category: "🗺️ Géographie", question: "Dans quel département se trouve le Mont-Saint-Michel ?", options: ["Calvados", "Ille-et-Vilaine", "Manche", "Côtes-d'Armor"], correct: 2 },
  { id: 20, category: "🗺️ Géographie", question: "Quelle ville française est surnommée « la Ville Rose » ?", options: ["Bordeaux", "Lyon", "Toulouse", "Montpellier"], correct: 2 },

  // ✍️ Grammaire & Conjugaison
  { id: 21, category: "✍️ Grammaire", question: "Laquelle de ces phrases est correctement orthographiée ?", options: ["Elle s'est lavée les mains", "Elle s'est lavé les mains", "Elle ce sont lavée les mains", "Elle s'est lavées les mains"], correct: 1 },
  { id: 22, category: "✍️ Grammaire", question: "Quel est le subjonctif présent d'« être » à la 3e personne du singulier ?", options: ["est", "serait", "soit", "sois"], correct: 2 },
  { id: 23, category: "✍️ Grammaire", question: "Quelle est la forme correcte du passé simple d'« avoir » à la 1ère personne du pluriel ?", options: ["nous avâmes", "nous eûmes", "nous avions", "nous eûmes pas"], correct: 1 },
  { id: 24, category: "✍️ Grammaire", question: "Laquelle de ces phrases contient une faute grammaticale ?", options: ["Quoi qu'il en soit", "Quelque soit la situation", "Bien qu'il soit parti", "Quoiqu'il arrive"], correct: 1 },
];
