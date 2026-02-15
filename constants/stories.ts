export interface StoryPage {
  text: string;
  mood: 'calm' | 'exciting' | 'warm' | 'mysterious';
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  category: 'courage' | 'kindness' | 'friendship' | 'dreams';
  heroId: string;
  duration: number;
  ageRange: string;
  iconName: string;
  gradient: [string, string];
  pages: StoryPage[];
}

export const CATEGORIES = [
  { id: 'all', label: 'All Stories', icon: 'sparkles' },
  { id: 'courage', label: 'Courage', icon: 'shield' },
  { id: 'kindness', label: 'Kindness', icon: 'heart' },
  { id: 'friendship', label: 'Friendship', icon: 'people' },
  { id: 'dreams', label: 'Dreams', icon: 'moon' },
] as const;

export const STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'The Starlight Shield',
    subtitle: 'Nova learns to protect others',
    category: 'courage',
    heroId: 'hero-1',
    duration: 5,
    ageRange: '3-7',
    iconName: 'shield-checkmark',
    gradient: ['#1a237e', '#4a148c'],
    pages: [
      { text: 'High above the sleeping city, Nova floated among the clouds. Her shield glowed softly, casting starlight across the rooftops below. Every night, she watched over the children as they drifted off to sleep.', mood: 'calm' },
      { text: '"Who needs me tonight?" Nova whispered to the wind. A tiny light flickered in a window far below, a nightlight that had gone out. A little child was afraid of the dark.', mood: 'warm' },
      { text: 'Nova swooped down gently, her cape trailing stardust behind her. She landed on the windowsill and peered inside. A small girl clutched her blanket tightly, eyes wide in the darkness.', mood: 'warm' },
      { text: '"Don\'t be afraid," Nova said softly. She held up her shield and it began to glow like a hundred fireflies, filling the room with a warm golden light.', mood: 'exciting' },
      { text: 'The little girl smiled and her eyes grew heavy. "Will you stay?" she asked sleepily. Nova nodded and placed a tiny star on the nightstand. "This star will keep you safe all night long."', mood: 'calm' },
      { text: 'As the girl closed her eyes, Nova whispered, "Being brave doesn\'t mean you\'re never scared. It means you keep going, even when the dark feels big." And with that, the little star glowed brighter than ever.', mood: 'calm' },
      { text: 'Nova flew back into the sky, her heart full of warmth. Below her, windows across the city began to glow with tiny stars. Every child who believed in courage had one. And they all slept soundly through the night.', mood: 'calm' },
    ],
  },
  {
    id: 'story-2',
    title: 'The Kindness Wave',
    subtitle: 'Coral spreads warmth across the ocean',
    category: 'kindness',
    heroId: 'hero-2',
    duration: 5,
    ageRange: '3-7',
    iconName: 'water',
    gradient: ['#006064', '#00838f'],
    pages: [
      { text: 'Deep beneath the moonlit ocean, Coral swam through gardens of glowing seaweed. Her tail shimmered with every color of the sunset, and wherever she went, the water grew warmer and kinder.', mood: 'calm' },
      { text: 'Tonight, the ocean felt cold. The fish were hiding and the coral reefs had lost their glow. Something was making everyone feel lonely and sad.', mood: 'mysterious' },
      { text: 'Coral found a little seahorse curled up behind a rock, all alone. "What\'s wrong, little one?" she asked gently. "Nobody wants to play with me," the seahorse said quietly.', mood: 'warm' },
      { text: 'Coral smiled and wrapped her glowing tail around the seahorse. "Sometimes, the bravest thing you can do is be kind first." She began to hum a gentle melody that rippled through the water.', mood: 'warm' },
      { text: 'The melody spread like a warm wave across the ocean floor. One by one, fish peeked out from their hiding spots. A starfish uncurled. A jellyfish began to dance. The ocean was waking up with kindness.', mood: 'exciting' },
      { text: 'Soon, all the sea creatures gathered around the little seahorse, each one sharing something kind, a smile, a gentle nudge, a softly glowing light. The seahorse giggled with joy.', mood: 'warm' },
      { text: 'As the moon rose higher, the ocean sparkled with warmth. Coral whispered to the sleeping seahorse, "Kindness is like a wave. Once it starts, it never really stops." And the whole ocean hummed a lullaby.', mood: 'calm' },
    ],
  },
  {
    id: 'story-3',
    title: 'The Friendship Constellation',
    subtitle: 'Orion finds friends in the stars',
    category: 'friendship',
    heroId: 'hero-3',
    duration: 6,
    ageRange: '4-8',
    iconName: 'star',
    gradient: ['#311b92', '#6200ea'],
    pages: [
      { text: 'Orion was the loneliest star in the sky. While other stars twinkled in groups, making beautiful patterns called constellations, Orion shone all by himself in a quiet corner of the universe.', mood: 'calm' },
      { text: '"I wish I had friends," Orion sighed, sending a shower of tiny sparkles into the darkness. A comet zooming by heard his wish and stopped. "Why don\'t you go find some?" the comet asked.', mood: 'warm' },
      { text: 'Orion was nervous. What if the other stars didn\'t like him? What if he was too dim or too bright? But he remembered what his mother moon had told him: "The right friends will love you for exactly who you are."', mood: 'warm' },
      { text: 'So Orion set off across the night sky. First, he met Luna, a small blue star who loved to tell stories. Then he found Sirius, a big bright star who loved to laugh. They were different from each other, but they got along perfectly.', mood: 'exciting' },
      { text: '"Let\'s make our own constellation!" Luna suggested. They all moved closer together, and something magical happened. Lines of light connected them, drawing a beautiful shape across the sky.', mood: 'exciting' },
      { text: 'Children on Earth looked up and gasped. "Look! A new constellation!" they cried with delight. Orion felt his heart glow brighter than ever before. He wasn\'t alone anymore.', mood: 'warm' },
      { text: 'From that night on, whenever a child looked up at the sky and saw Orion\'s constellation, they would remember: true friends are worth searching for, and the best friendships make everyone shine brighter.', mood: 'calm' },
      { text: 'Orion twinkled softly as the children below closed their eyes. "Goodnight, friends," he whispered. And every star in his constellation twinkled back. The night was peaceful, and full of friendship.', mood: 'calm' },
    ],
  },
  {
    id: 'story-4',
    title: 'The Dream Weaver',
    subtitle: 'Luna crafts beautiful dreams',
    category: 'dreams',
    heroId: 'hero-4',
    duration: 5,
    ageRange: '3-7',
    iconName: 'cloudy-night',
    gradient: ['#4a148c', '#7b1fa2'],
    pages: [
      { text: 'Luna was a Dream Weaver, one of the most special heroes in the night sky. While other heroes fought villains, Luna did something even more powerful: she made beautiful dreams for sleeping children.', mood: 'calm' },
      { text: 'Every evening, as the sun said goodnight, Luna would open her Dream Loom. It was made of moonbeams and starlight, and it hummed with a gentle melody that only sleeping hearts could hear.', mood: 'mysterious' },
      { text: 'Tonight, she wove a dream about a magical garden where flowers sang lullabies and butterflies carried wishes on their wings. She sprinkled in the scent of warm cookies and the sound of gentle rain.', mood: 'warm' },
      { text: 'She sent the dream floating down to Earth on a ribbon of silver moonlight. It drifted through an open window and settled gently on a sleeping child\'s pillow, like a whispered secret.', mood: 'calm' },
      { text: 'In the dream, the child found themselves flying over rainbow mountains and swimming through cotton-candy clouds. A friendly dragon offered them a ride, and together they explored a castle made entirely of pillows.', mood: 'exciting' },
      { text: 'Luna smiled as she watched. "Sweet dreams are made of the things that make you happiest," she whispered, adding a sprinkle of extra stardust for good measure.', mood: 'warm' },
      { text: 'As the night grew deeper, Luna wove dream after dream, each one unique and wonderful. And as the first light of dawn appeared, she closed her loom and whispered, "Sleep tight, little ones. Tomorrow night, I\'ll weave you something even more magical."', mood: 'calm' },
    ],
  },
  {
    id: 'story-5',
    title: 'The Brave Little Cloud',
    subtitle: 'Nimbus overcomes a storm',
    category: 'courage',
    heroId: 'hero-5',
    duration: 5,
    ageRange: '3-6',
    iconName: 'cloud',
    gradient: ['#1565c0', '#0d47a1'],
    pages: [
      { text: 'Nimbus was the smallest cloud in the sky. While the big clouds rumbled with thunder and flashed with lightning, Nimbus could only make the tiniest little raindrops, barely enough to water a single flower.', mood: 'calm' },
      { text: 'One night, a great storm rolled in, dark and scary, with winds that howled like wolves. All the other clouds were swept away, tumbling across the sky. But little Nimbus held on tight.', mood: 'mysterious' },
      { text: '"I\'m scared," Nimbus whispered. But then he looked down and saw a garden of flowers shivering in the cold wind. They needed protection. They needed someone brave.', mood: 'warm' },
      { text: 'Nimbus puffed himself up as big as he could. He spread his cloud-wings wide and floated right over the garden, shielding the flowers from the harsh wind and cold rain.', mood: 'exciting' },
      { text: 'The storm raged all around him, but Nimbus didn\'t move. He held steady, and his tiny raindrops became a gentle, warm mist that kept the flowers safe and cozy beneath him.', mood: 'warm' },
      { text: 'When morning came, the storm was gone. The flowers looked up at Nimbus and bloomed in every color of the rainbow, their way of saying thank you. Nimbus had never felt so proud.', mood: 'warm' },
      { text: 'That night, as children everywhere closed their eyes, Nimbus drifted overhead, soft and fluffy. He whispered to each one: "You don\'t have to be big to be brave. You just have to care." And all the children smiled in their sleep.', mood: 'calm' },
    ],
  },
  {
    id: 'story-6',
    title: 'The Moonlit Garden',
    subtitle: 'Bloom grows a garden of dreams',
    category: 'dreams',
    heroId: 'hero-6',
    duration: 6,
    ageRange: '3-7',
    iconName: 'flower',
    gradient: ['#1b5e20', '#2e7d32'],
    pages: [
      { text: 'In a secret valley between two sleeping mountains, there was a garden that only appeared at night. This was Bloom\'s garden, where dreams grew like flowers under the moonlight.', mood: 'mysterious' },
      { text: 'Every evening, Bloom would fly down from the stars, her wings leaving trails of silver pollen. She\'d land softly among her dream plants and begin her nightly work of tending to them.', mood: 'calm' },
      { text: 'Each plant grew a different kind of dream. The tall sunflowers grew adventure dreams. The tiny violets grew peaceful dreams. And the roses? They grew the most wonderful dreams of all: dreams about the people you love.', mood: 'warm' },
      { text: 'Tonight, Bloom noticed a new seedling pushing through the moonlit soil. It was small and pale, almost afraid to grow. "What kind of dream will you be?" Bloom asked, gently watering it with starlight.', mood: 'warm' },
      { text: 'The seedling stretched and grew, and grew, and grew! It became the tallest plant in the garden, with petals that shimmered like galaxies. It was a dream about believing in yourself.', mood: 'exciting' },
      { text: 'Bloom carefully picked the dream-flower and blew on its petals. A thousand tiny seeds floated up into the night sky, each one carried by the wind to a sleeping child somewhere in the world.', mood: 'calm' },
      { text: 'As the seeds settled on pillows and teddy bears, children everywhere began to dream about all the amazing things they could do and be. Bloom smiled and whispered, "Grow, little dreamers. Grow."', mood: 'warm' },
      { text: 'And in the moonlit garden, a hundred new seedlings pushed through the soil, each one a brand-new dream waiting to be dreamed. Tomorrow night, Bloom would tend to them all. But for now, even heroes need their rest.', mood: 'calm' },
    ],
  },
  {
    id: 'story-7',
    title: 'The Night Train',
    subtitle: 'Whistle takes children to Dreamland',
    category: 'dreams',
    heroId: 'hero-7',
    duration: 5,
    ageRange: '3-6',
    iconName: 'train',
    gradient: ['#37474f', '#263238'],
    pages: [
      { text: 'Every night at exactly bedtime o\'clock, a magical train appeared at the edge of the sky. Its conductor was a friendly hero named Whistle, who wore a cap made of woven moonbeams and a coat stitched from the softest clouds.', mood: 'mysterious' },
      { text: '"All aboard the Night Train!" Whistle called out, his voice gentle as a lullaby. The train\'s whistle tooted softly, not loud enough to wake anyone, but just right for dreamers to hear.', mood: 'warm' },
      { text: 'The train had special carriages: one was filled with fluffy pillows, another had walls made of aquariums with friendly fish, and the last carriage had windows that showed your favorite memories floating by like soap bubbles.', mood: 'exciting' },
      { text: 'Tonight\'s passengers were all the children who had brushed their teeth, put on their pajamas, and climbed into bed. Their dream-selves floated up to the platform and boarded the train with sleepy smiles.', mood: 'warm' },
      { text: 'The Night Train chugged along the Milky Way, passing planets that waved hello and comets that zoomed alongside like playful puppies. The stars sang a gentle song as the train rolled by.', mood: 'calm' },
      { text: 'One by one, the children arrived at their dream destinations. A land of talking animals for one, a chocolate waterfall for another, a kingdom where everyone could fly for a third.', mood: 'exciting' },
      { text: 'Whistle smiled and tipped his moonbeam cap. "Sleep well, little travelers. The Night Train will be here tomorrow to take you on another adventure." And with a soft toot, the train disappeared into the dawn.', mood: 'calm' },
    ],
  },
  {
    id: 'story-8',
    title: 'The Shadow Friend',
    subtitle: 'Shade teaches us not to fear the dark',
    category: 'courage',
    heroId: 'hero-8',
    duration: 5,
    ageRange: '4-8',
    iconName: 'contrast',
    gradient: ['#212121', '#424242'],
    pages: [
      { text: 'Shade was a hero made entirely of shadows. Most children were scared of him at first, because he lived in the dark. But Shade was actually the gentlest hero of all.', mood: 'mysterious' },
      { text: 'His job was to make the dark feel safe. While other heroes brought light, Shade showed children that darkness itself could be a friend, a soft blanket that helped them rest.', mood: 'warm' },
      { text: 'One night, Shade heard a child say, "I\'m afraid of the dark!" He slipped under the door like a whisper and stood in the corner of the room, making himself into funny shapes, a bunny, then a bird, then a dancing bear.', mood: 'warm' },
      { text: 'The child peeked out from under the covers and giggled. "You\'re silly!" Shade made himself into a butterfly that fluttered across the ceiling. The child laughed out loud.', mood: 'exciting' },
      { text: '"See?" Shade said in his soft, velvety voice. "The dark isn\'t scary. It\'s where all the best adventures happen, where dreams live and stars shine and the moon tells stories."', mood: 'warm' },
      { text: 'The child nodded and snuggled deeper into the blankets. "Will you stay?" Shade curled up at the foot of the bed like a shadow cat. "Always," he purred. "I\'m always here when the lights go out."', mood: 'calm' },
      { text: 'And from that night on, the child was never afraid of the dark again. Because they knew that in every shadow, there was a friend watching over them, keeping the night soft and safe and full of wonderful dreams.', mood: 'calm' },
    ],
  },
];
