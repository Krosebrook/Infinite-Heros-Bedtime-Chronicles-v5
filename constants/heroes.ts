export interface Hero {
  id: string;
  name: string;
  title: string;
  power: string;
  description: string;
  iconName: string;
  color: string;
  gradient: [string, string];
  constellation: string;
}

export const HEROES: Hero[] = [
  {
    id: 'hero-1',
    name: 'Nova',
    title: 'Guardian of Light',
    power: 'Starlight Shield',
    description: 'Nova protects sleeping children with her magical shield that glows like a thousand stars. She turns nightlights into tiny stars that keep the dark at bay.',
    iconName: 'shield-half-sharp',
    color: '#FFD54F',
    gradient: ['#1a237e', '#283593'],
    constellation: 'The Shield',
  },
  {
    id: 'hero-2',
    name: 'Coral',
    title: 'Heart of the Ocean',
    power: 'Kindness Wave',
    description: 'Coral swims through moonlit oceans, spreading warmth and kindness wherever she goes. Her tail shimmers with sunset colors and her songs heal lonely hearts.',
    iconName: 'water',
    color: '#4DD0E1',
    gradient: ['#006064', '#00838f'],
    constellation: 'The Wave',
  },
  {
    id: 'hero-3',
    name: 'Orion',
    title: 'Star of Friendship',
    power: 'Constellation Bond',
    description: 'Once the loneliest star in the sky, Orion now connects friends across the universe. His constellation reminds everyone that true friends make you shine brighter.',
    iconName: 'star',
    color: '#B388FF',
    gradient: ['#311b92', '#4527a0'],
    constellation: 'The Bridge',
  },
  {
    id: 'hero-4',
    name: 'Luna',
    title: 'The Dream Weaver',
    power: 'Dream Loom',
    description: 'Luna weaves beautiful dreams on her magical loom made of moonbeams and starlight. Each dream is unique and full of the things that make children happiest.',
    iconName: 'moon',
    color: '#CE93D8',
    gradient: ['#4a148c', '#6a1b9a'],
    constellation: 'The Loom',
  },
  {
    id: 'hero-5',
    name: 'Nimbus',
    title: 'The Brave Cloud',
    power: 'Storm Shield',
    description: 'The smallest cloud with the biggest heart. Nimbus proves that you don\'t need to be big to be brave. He protects gardens and children from scary storms.',
    iconName: 'cloud',
    color: '#90CAF9',
    gradient: ['#1565c0', '#1976d2'],
    constellation: 'The Cloud',
  },
  {
    id: 'hero-6',
    name: 'Bloom',
    title: 'Garden Keeper',
    power: 'Dream Seeds',
    description: 'Bloom tends the magical moonlit garden where dreams grow like flowers. Her silver wings scatter dream-seeds across the world, planting beautiful visions in sleeping minds.',
    iconName: 'flower',
    color: '#A5D6A7',
    gradient: ['#1b5e20', '#2e7d32'],
    constellation: 'The Garden',
  },
  {
    id: 'hero-7',
    name: 'Whistle',
    title: 'Night Train Conductor',
    power: 'Dream Express',
    description: 'Every night at bedtime o\'clock, Whistle drives the magical Night Train along the Milky Way, carrying dreaming children to wonderful destinations among the stars.',
    iconName: 'train',
    color: '#B0BEC5',
    gradient: ['#37474f', '#455a64'],
    constellation: 'The Track',
  },
  {
    id: 'hero-8',
    name: 'Shade',
    title: 'Shadow Friend',
    power: 'Shadow Play',
    description: 'Made entirely of shadows, Shade is the gentlest hero of all. He makes funny shadow shapes to show children that the dark is nothing to fear, just a cozy blanket for sleeping.',
    iconName: 'contrast',
    color: '#78909C',
    gradient: ['#212121', '#37474f'],
    constellation: 'The Shadow',
  },
];
