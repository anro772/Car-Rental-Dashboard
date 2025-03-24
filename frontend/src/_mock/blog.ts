// src/_mock/blog.ts
import { faker } from '@faker-js/faker';

// Create a set of authors for the blog posts
const AUTHORS = [
    {
        name: 'Alex Morgan',
        avatarUrl: '/assets/images/avatars/avatar_1.jpg',
    },
    {
        name: 'Elena Wright',
        avatarUrl: '/assets/images/avatars/avatar_2.jpg',
    },
    {
        name: 'Michael Chen',
        avatarUrl: '/assets/images/avatars/avatar_3.jpg',
    },
    {
        name: 'Sarah Johnson',
        avatarUrl: '/assets/images/avatars/avatar_4.jpg',
    },
    {
        name: 'Daniel Carter',
        avatarUrl: '/assets/images/avatars/avatar_5.jpg',
    },
];

// Generate placeholders with different colors for each post
const generatePlaceholder = (index: number) => {
    // Create a cycle of different colors for visual interest
    const colors = [
        '1877F2', // Blue (primary color)
        '8E33FF', // Purple (secondary color)
        '22C55E', // Green
        'FFAB00', // Amber
        'FF5630', // Red
    ];
    const color = colors[index % colors.length];

    // Return a placeholder.co URL with the selected color
    return `https://placehold.co/800x450/${color}/FFFFFF`;
};

// Create relevant blog posts for a car rental business
export const _carRentalPosts = [
    {
        id: faker.string.uuid(),
        title: "10 Tips to Save Money on Your Next Car Rental",
        description: "Learn insider strategies to get the best deals on car rentals. From booking in advance to knowing which insurance you actually need, these tips will help you save on your next rental.",
        coverUrl: generatePlaceholder(0),
        categories: ["Saving Tips"],
        totalViews: faker.number.int({ min: 500, max: 2000 }),
        totalShares: faker.number.int({ min: 20, max: 100 }),
        totalComments: faker.number.int({ min: 5, max: 30 }),
        totalFavorites: faker.number.int({ min: 10, max: 50 }),
        postedAt: faker.date.recent({ days: 7 }).toISOString(),
        author: AUTHORS[0],
    },
    {
        id: faker.string.uuid(),
        title: "Choosing the Right Car Type for Your Trip: A Complete Guide",
        description: "Wondering whether to rent an SUV, sedan, or compact? This guide breaks down the pros and cons of each car type for different travel scenarios, helping you make the perfect choice.",
        coverUrl: generatePlaceholder(1),
        categories: ["Car Features"],
        totalViews: faker.number.int({ min: 800, max: 3000 }),
        totalShares: faker.number.int({ min: 30, max: 150 }),
        totalComments: faker.number.int({ min: 8, max: 40 }),
        totalFavorites: faker.number.int({ min: 15, max: 70 }),
        postedAt: faker.date.recent({ days: 14 }).toISOString(),
        author: AUTHORS[1],
    },
    {
        id: faker.string.uuid(),
        title: "The Ultimate Road Trip Checklist: What to Pack and Prepare",
        description: "Planning a road trip? Don't hit the road without reviewing this essential checklist. From emergency supplies to entertainment options, we've got you covered for a smooth journey.",
        coverUrl: generatePlaceholder(2),
        categories: ["Road Trips", "Safety"],
        totalViews: faker.number.int({ min: 1000, max: 5000 }),
        totalShares: faker.number.int({ min: 50, max: 200 }),
        totalComments: faker.number.int({ min: 15, max: 60 }),
        totalFavorites: faker.number.int({ min: 25, max: 100 }),
        postedAt: faker.date.recent({ days: 21 }).toISOString(),
        author: AUTHORS[2],
    },
    {
        id: faker.string.uuid(),
        title: "Understanding Car Rental Insurance: What You Need and What You Don't",
        description: "Car rental insurance options can be confusing and expensive. Learn what your existing insurance covers, when to purchase additional coverage, and how to avoid unnecessary fees.",
        coverUrl: generatePlaceholder(3),
        categories: ["Saving Tips", "Safety"],
        totalViews: faker.number.int({ min: 700, max: 2500 }),
        totalShares: faker.number.int({ min: 25, max: 120 }),
        totalComments: faker.number.int({ min: 10, max: 45 }),
        totalFavorites: faker.number.int({ min: 18, max: 80 }),
        postedAt: faker.date.recent({ days: 28 }).toISOString(),
        author: AUTHORS[3],
    },
    {
        id: faker.string.uuid(),
        title: "5 Scenic Routes Perfect for Your Rental Car Adventure",
        description: "Discover breathtaking drives that showcase natural beauty and exciting attractions. These routes are ideal for making the most of your rental car and creating unforgettable travel memories.",
        coverUrl: generatePlaceholder(4),
        categories: ["Road Trips"],
        totalViews: faker.number.int({ min: 900, max: 3500 }),
        totalShares: faker.number.int({ min: 40, max: 180 }),
        totalComments: faker.number.int({ min: 12, max: 50 }),
        totalFavorites: faker.number.int({ min: 22, max: 90 }),
        postedAt: faker.date.recent({ days: 35 }).toISOString(),
        author: AUTHORS[4],
    },
    {
        id: faker.string.uuid(),
        title: "Electric vs. Hybrid vs. Gas: Which Rental Car Is Right for You?",
        description: "As rental fleets diversify, choosing between electric, hybrid, and traditional gas vehicles can be challenging. Compare the pros and cons of each option based on your travel needs and environmental concerns.",
        coverUrl: generatePlaceholder(0),
        categories: ["Car Features"],
        totalViews: faker.number.int({ min: 600, max: 2200 }),
        totalShares: faker.number.int({ min: 20, max: 110 }),
        totalComments: faker.number.int({ min: 7, max: 35 }),
        totalFavorites: faker.number.int({ min: 12, max: 60 }),
        postedAt: faker.date.recent({ days: 42 }).toISOString(),
        author: AUTHORS[0],
    },
    {
        id: faker.string.uuid(),
        title: "Business Travel: Maximizing Productivity with Your Rental Car",
        description: "Tips for business travelers on choosing the right rental car, utilizing travel time effectively, and navigating unfamiliar business districts. Make your next business trip more productive and less stressful.",
        coverUrl: generatePlaceholder(1),
        categories: ["Car Features", "Saving Tips"],
        totalViews: faker.number.int({ min: 500, max: 1800 }),
        totalShares: faker.number.int({ min: 15, max: 90 }),
        totalComments: faker.number.int({ min: 5, max: 25 }),
        totalFavorites: faker.number.int({ min: 10, max: 45 }),
        postedAt: faker.date.recent({ days: 49 }).toISOString(),
        author: AUTHORS[1],
    },
    {
        id: faker.string.uuid(),
        title: "Winter Driving Tips: Staying Safe in Your Rental Car",
        description: "Renting a car in winter conditions requires special preparation and driving techniques. Learn essential winter driving tips to keep you safe and comfortable during cold-weather travels.",
        coverUrl: generatePlaceholder(2),
        categories: ["Safety", "Road Trips"],
        totalViews: faker.number.int({ min: 700, max: 2400 }),
        totalShares: faker.number.int({ min: 25, max: 115 }),
        totalComments: faker.number.int({ min: 9, max: 40 }),
        totalFavorites: faker.number.int({ min: 15, max: 65 }),
        postedAt: faker.date.recent({ days: 56 }).toISOString(),
        author: AUTHORS[2],
    },
    {
        id: faker.string.uuid(),
        title: "Family-Friendly Car Rentals: Features That Matter Most",
        description: "Traveling with kids? Discover which car features and rental add-ons make family trips smoother, from entertainment systems to safety features and space considerations.",
        coverUrl: generatePlaceholder(3),
        categories: ["Car Features", "Safety"],
        totalViews: faker.number.int({ min: 800, max: 2800 }),
        totalShares: faker.number.int({ min: 30, max: 140 }),
        totalComments: faker.number.int({ min: 10, max: 45 }),
        totalFavorites: faker.number.int({ min: 20, max: 75 }),
        postedAt: faker.date.recent({ days: 63 }).toISOString(),
        author: AUTHORS[3],
    },
    {
        id: faker.string.uuid(),
        title: "How to Handle a Rental Car Breakdown: Steps to Take and Whom to Contact",
        description: "Vehicle breakdowns can happen even with well-maintained rental cars. Learn the proper procedures to follow if your rental car experiences mechanical issues, including emergency contacts and documentation.",
        coverUrl: generatePlaceholder(4),
        categories: ["Safety"],
        totalViews: faker.number.int({ min: 600, max: 2100 }),
        totalShares: faker.number.int({ min: 20, max: 100 }),
        totalComments: faker.number.int({ min: 8, max: 35 }),
        totalFavorites: faker.number.int({ min: 12, max: 55 }),
        postedAt: faker.date.recent({ days: 70 }).toISOString(),
        author: AUTHORS[4],
    },
    {
        id: faker.string.uuid(),
        title: "The Future of Car Rentals: Technology and Trends to Watch",
        description: "From contactless rentals to autonomous vehicles, explore how technology is transforming the car rental industry and what innovations you can expect to see in the coming years.",
        coverUrl: generatePlaceholder(0),
        categories: ["Car Features"],
        totalViews: faker.number.int({ min: 900, max: 3200 }),
        totalShares: faker.number.int({ min: 40, max: 160 }),
        totalComments: faker.number.int({ min: 12, max: 55 }),
        totalFavorites: faker.number.int({ min: 25, max: 95 }),
        postedAt: faker.date.recent({ days: 77 }).toISOString(),
        author: AUTHORS[0],
    },
    {
        id: faker.string.uuid(),
        title: "Airport Car Rentals: Navigating the Process Efficiently",
        description: "Airport car rentals can be hectic after a long flight. Learn how to streamline the process, avoid common pitfalls, and get on the road quickly with these expert tips.",
        coverUrl: generatePlaceholder(1),
        categories: ["Saving Tips"],
        totalViews: faker.number.int({ min: 750, max: 2600 }),
        totalShares: faker.number.int({ min: 28, max: 130 }),
        totalComments: faker.number.int({ min: 9, max: 42 }),
        totalFavorites: faker.number.int({ min: 16, max: 70 }),
        postedAt: faker.date.recent({ days: 84 }).toISOString(),
        author: AUTHORS[1],
    },
];

// Export to maintain compatibility with existing code
export const _posts = _carRentalPosts;