// Mock collection data for marketplace

export const mockCollections = [
  {
    id: 'cosmic-voyagers',
    slug: 'cosmic-voyagers',
    name: 'Cosmic Voyagers',
    description: 'A collection of interstellar travelers exploring the far reaches of the universe. Each Voyager is unique, with distinct traits representing their journey through space and time.',
    bannerImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=400&fit=crop',
    logoImage: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=200&h=200&fit=crop',
    creator: '0x1234...5678',
    createdAt: '2024-01-15',
    itemCount: 42,
    floorPrice: '0.05',
    totalVolume: '12.5',
    verified: true,
    category: 'Art',
  },
  {
    id: 'neon-dreams',
    slug: 'neon-dreams',
    name: 'Neon Dreams',
    description: 'Cyberpunk-inspired digital art featuring neon cityscapes, futuristic characters, and glowing abstractions. Step into a world where technology meets art.',
    bannerImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop',
    logoImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    creator: '0xabcd...ef01',
    createdAt: '2024-02-20',
    itemCount: 156,
    floorPrice: '0.12',
    totalVolume: '89.3',
    verified: true,
    category: 'Art',
  },
  {
    id: 'pixel-legends',
    slug: 'pixel-legends',
    name: 'Pixel Legends',
    description: 'Retro-style pixel art characters and scenes that pay homage to classic gaming. Collect legendary heroes, villains, and everything in between.',
    bannerImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop&sat=-100&hue=180',
    logoImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop',
    creator: '0x9876...5432',
    createdAt: '2024-03-01',
    itemCount: 88,
    floorPrice: '0.03',
    totalVolume: '24.7',
    verified: false,
    category: 'Gaming',
  },
  {
    id: 'abstract-minds',
    slug: 'abstract-minds',
    name: 'Abstract Minds',
    description: 'Generative abstract art exploring the boundaries of color, form, and motion. Each piece is algorithmically unique.',
    bannerImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&h=400&fit=crop',
    logoImage: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=200&h=200&fit=crop',
    creator: '0x2468...1357',
    createdAt: '2024-03-10',
    itemCount: 200,
    floorPrice: '0.08',
    totalVolume: '156.2',
    verified: true,
    category: 'Generative',
  },
]

export const getCollectionBySlug = (slug) => {
  return mockCollections.find(c => c.slug === slug) || null
}

export const getAllCollections = () => mockCollections
