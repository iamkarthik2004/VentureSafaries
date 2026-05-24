/**
 * Venture Safaries — Data Service Layer
 * 
 * Abstraction over localStorage for all data operations.
 * To migrate to Firebase/Supabase/MongoDB, replace only this file.
 * 
 * Collections: vs_packages, vs_destinations, vs_reviews, vs_requests,
 *              vs_faqs, vs_gallery
 * Singletons:  vs_homepage, vs_settings
 */

const DataService = (() => {

  /* ─── Helpers ─── */

  function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`DataService: Failed to read "${key}"`, e);
      return null;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`DataService: Failed to write "${key}"`, e);
      return false;
    }
  }

  /* ─── Collection CRUD (arrays) ─── */

  function getAll(collection) {
    return _read(collection) || [];
  }

  function getById(collection, id) {
    const items = getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  function create(collection, item) {
    const items = getAll(collection);
    // Duplicate check by title or name
    const nameField = item.title || item.name || item.question;
    if (nameField) {
      const exists = items.find(i =>
        (i.title || i.name || i.question || '').toLowerCase().trim() === nameField.toLowerCase().trim()
      );
      if (exists) {
        return { success: false, error: 'An item with this name already exists.' };
      }
    }
    const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    _write(collection, items);
    return { success: true, item: newItem };
  }

  function update(collection, id, data) {
    const items = getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return { success: false, error: 'Item not found.' };
    // Duplicate check (exclude self)
    const nameField = data.title || data.name || data.question;
    if (nameField) {
      const exists = items.find(i =>
        i.id !== id &&
        (i.title || i.name || i.question || '').toLowerCase().trim() === nameField.toLowerCase().trim()
      );
      if (exists) {
        return { success: false, error: 'An item with this name already exists.' };
      }
    }
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    _write(collection, items);
    return { success: true, item: items[index] };
  }

  function remove(collection, id) {
    let items = getAll(collection);
    const len = items.length;
    items = items.filter(item => item.id !== id);
    if (items.length === len) return { success: false, error: 'Item not found.' };
    _write(collection, items);
    return { success: true };
  }

  /* ─── Singleton CRUD (objects) ─── */

  function get(key) {
    return _read(key);
  }

  function set(key, value) {
    return _write(key, value);
  }

  /* ─── Seed Default Data ─── */

  function seed(force = false) {
    const schemaVersion = localStorage.getItem('vs_schema_version');
    if (!force && _read('vs_seeded') && schemaVersion === '4.0') return;
    localStorage.setItem('vs_schema_version', '4.0');

    // Settings
    _write('vs_settings', {
      siteName: 'Venture Safaries',
      logo: 'venture_safaris.jpg',
      adminEmail: 'admin@venturesafaries.com',
      adminPassword: 'admin123',
      primaryColor: '#e2b755',
      socialLinks: {
        facebook: 'https://facebook.com/venturesafaries',
        instagram: 'https://instagram.com/venturesafaries',
        twitter: 'https://twitter.com/venturesafaries',
        youtube: 'https://youtube.com/venturesafaries'
      }
    });

    // Homepage
    _write('vs_homepage', {
      heroTitle: 'Discover the World\'s Most Breathtaking Destinations',
      heroSubtitle: 'Luxury adventures and customized tours crafted for the extraordinary traveler. Experience the untamed beauty of God\'s Own Country.',
      heroImage: 'https://images.unsplash.com/photo-1516426122078-c23e76b4f964?w=1920&q=80',
      ctaText: 'Explore Adventures',
      aboutTitle: 'Exquisite Kerala Journeys',
      aboutText: 'Based in the heart of Kerala, Venture Safaries is a premium travel concern by A Friends Media Center. We specialize in crafting Tailored Trips, Group Tours, and Custom Packages that let you explore, experience, and enjoy the absolute pinnacle of God\'s Own Country.\n\nFrom the mist-draped hill stations of Munnar and lush wildlife sanctuaries of Thekkady, to the tranquil luxury houseboats gliding through Alappuzha\'s historic backwaters and palm-fringed coastlines of Varkala, we translate your travel dreams into deeply emotional, immersive, and luxurious realities. Our expert guides, hand-selected boutique properties, and pristine itineraries ensure every moment is crafted to perfection.',
      aboutImage: 'kerala_backwaters.png',
      stats: [
        { label: 'Happy Travelers', value: '15,000+', icon: '🌍' },
        { label: 'Destinations', value: '120+', icon: '📍' },
        { label: 'Expert Guides', value: '85+', icon: '🧭' },
        { label: 'Years Experience', value: '12+', icon: '⭐' }
      ],
      bannerImage: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80',
      bannerText: 'Ready for Your Next Adventure?',
      footerText: 'Tour Agency — ᴀ ꜰʀɪᴇɴᴅꜱ ᴍᴇᴅɪᴀ ᴄᴇɴᴛᴇʀ ᴄᴏɴᴄᴇʀɴ. Tailored Trips | Group Tours | Custom Packages. Explore.. Experience.. Enjoy.. 🌍',
      footerPhone: '9495514128 | 6238118024',
      footerEmail: 'DM or hello@venturesafaries.com',
      footerAddress: 'Kerala, India'
    });

    // Packages
    _write('vs_packages', [
      {
        id: generateId(), title: 'African Safari Expedition',
        destination: 'Kenya & Tanzania', duration: '10 Days / 9 Nights',
        price: 4599, description: 'Embark on an awe-inspiring journey through the untamed wilderness of East Africa. Witness the Great Migration, encounter the Big Five, and sleep under a canopy of stars in luxury tented camps.',
        image: 'https://images.unsplash.com/photo-1516426122078-c23e76b4f964?w=600&q=80',
        itinerary: ['Day 1-2: Arrive Nairobi, Amboseli National Park', 'Day 3-4: Masai Mara Game Reserve', 'Day 5-6: Serengeti National Park', 'Day 7-8: Ngorongoro Crater', 'Day 9: Lake Manyara', 'Day 10: Departure'],
        facilities: ['Luxury Tented Camps', 'Private 4x4 Vehicles', 'Professional Guide', 'All Meals Included', 'Airport Transfers', 'Travel Insurance'],
        activities: ['Game Drives', 'Hot Air Balloon Ride', 'Masai Village Visit', 'Bird Watching', 'Photography Tours'],
        gallery: ['https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80', 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Bali Paradise Retreat',
        destination: 'Bali, Indonesia', duration: '7 Days / 6 Nights',
        price: 2899, description: 'Discover the enchanting island of Bali where ancient temples meet pristine beaches. Immerse yourself in rich Balinese culture, explore terraced rice paddies, and rejuvenate at world-class spas.',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
        itinerary: ['Day 1: Arrive Denpasar, Ubud', 'Day 2: Rice Terraces & Monkey Forest', 'Day 3: Water Temples & Waterfalls', 'Day 4: Seminyak Beach', 'Day 5: Nusa Penida Island', 'Day 6: Spa & Culture', 'Day 7: Departure'],
        facilities: ['5-Star Villa Resort', 'Private Driver', 'Spa Access', 'Breakfast Included', 'Snorkeling Gear', 'Wi-Fi'],
        activities: ['Temple Tours', 'Surfing Lessons', 'Cooking Class', 'Snorkeling', 'Yoga Sessions'],
        gallery: ['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Swiss Alps Adventure',
        destination: 'Switzerland', duration: '8 Days / 7 Nights',
        price: 5299, description: 'Conquer the majestic Swiss Alps on this premium adventure package. From scenic train rides through pristine valleys to exhilarating paragliding over crystal lakes, Switzerland awaits.',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&q=80',
        itinerary: ['Day 1: Arrive Zurich', 'Day 2: Lucerne & Mt. Pilatus', 'Day 3: Interlaken', 'Day 4: Jungfraujoch', 'Day 5: Zermatt & Matterhorn', 'Day 6: Glacier Express', 'Day 7: Lake Geneva', 'Day 8: Departure'],
        facilities: ['4-Star Hotels', 'Swiss Travel Pass', 'Mountain Guide', 'Half Board', 'Cable Car Passes', 'Travel Insurance'],
        activities: ['Paragliding', 'Hiking', 'Scenic Train Rides', 'Skiing (Winter)', 'Lake Cruises'],
        gallery: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Maldives Luxury Escape',
        destination: 'Maldives', duration: '6 Days / 5 Nights',
        price: 6499, description: 'Indulge in the ultimate tropical luxury at an overwater villa in the Maldives. Crystal-clear turquoise waters, pristine white sand beaches, and world-class dining await you in paradise.',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80',
        itinerary: ['Day 1: Arrive Malé, Speedboat to Resort', 'Day 2: Snorkeling & Spa', 'Day 3: Dolphin Cruise & Diving', 'Day 4: Island Hopping', 'Day 5: Sunset Fishing & Beach Dinner', 'Day 6: Departure'],
        facilities: ['Overwater Villa', 'Private Pool', 'All-Inclusive Dining', 'Spa Access', 'Water Sports Equipment', 'Butler Service'],
        activities: ['Scuba Diving', 'Snorkeling', 'Sunset Cruise', 'Deep Sea Fishing', 'Kayaking'],
        gallery: ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&q=80'],
        featured: false, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Patagonia Wilderness Trek',
        destination: 'Chile & Argentina', duration: '12 Days / 11 Nights',
        price: 5899, description: 'Explore the rugged, untouched beauty of Patagonia. Trek through Torres del Paine, sail past glaciers, and witness some of the most dramatic landscapes on Earth.',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
        itinerary: ['Day 1-2: Arrive Santiago, Fly to Punta Arenas', 'Day 3-5: Torres del Paine W Trek', 'Day 6: Perito Moreno Glacier', 'Day 7-8: El Chaltén & Mt Fitz Roy', 'Day 9-10: Ushuaia & Beagle Channel', 'Day 11-12: Buenos Aires & Departure'],
        facilities: ['Mountain Lodges', 'Expert Trek Guide', 'All Meals', 'Internal Flights', 'Camping Equipment', 'Emergency Satellite Phone'],
        activities: ['Trekking', 'Glacier Hiking', 'Kayaking', 'Wildlife Watching', 'Photography'],
        gallery: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80'],
        featured: false, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Japanese Cultural Odyssey',
        destination: 'Japan', duration: '9 Days / 8 Nights',
        price: 4199, description: 'Journey through the Land of the Rising Sun, from the neon-lit streets of Tokyo to the ancient temples of Kyoto. Experience the perfect harmony of tradition and modernity.',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
        itinerary: ['Day 1-2: Tokyo – Shibuya, Akihabara, Tsukiji', 'Day 3: Mt. Fuji Day Trip', 'Day 4-5: Kyoto – Temples & Geisha District', 'Day 6: Nara & Osaka', 'Day 7: Hiroshima & Miyajima Island', 'Day 8: Hakone Onsen', 'Day 9: Departure'],
        facilities: ['Ryokan & Hotels', 'Japan Rail Pass', 'English Guide', 'Breakfast Daily', 'Pocket Wi-Fi', 'Cultural Experiences'],
        activities: ['Tea Ceremony', 'Sushi Making Class', 'Temple Tours', 'Bullet Train Ride', 'Onsen Experience'],
        gallery: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      }
    ]);

    // Destinations
    _write('vs_destinations', [
      {
        id: generateId(), name: 'Kenya', country: 'East Africa',
        description: 'Home to the Great Migration and the iconic Masai Mara, Kenya offers an unparalleled safari experience with diverse landscapes from savannahs to coastal beaches.',
        image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&q=80',
        highlights: ['Masai Mara', 'Great Migration', 'Big Five Safari', 'Diani Beach', 'Mt. Kenya'],
        gallery: ['https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Bali', country: 'Indonesia',
        description: 'A tropical paradise where ancient Hindu temples, lush rice terraces, and pristine beaches create a dreamlike destination for every traveler.',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
        highlights: ['Ubud Rice Terraces', 'Uluwatu Temple', 'Seminyak Beach', 'Nusa Penida', 'Mount Batur'],
        gallery: ['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Switzerland', country: 'Europe',
        description: 'The alpine wonderland of Switzerland offers breathtaking mountain scenery, pristine lakes, charming villages, and world-class adventure activities year-round.',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&q=80',
        highlights: ['Jungfraujoch', 'Lake Geneva', 'Matterhorn', 'Glacier Express', 'Interlaken'],
        gallery: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Maldives', country: 'South Asia',
        description: 'A string of 26 atolls in the Indian Ocean, the Maldives is the ultimate tropical luxury destination with crystal waters, coral reefs, and overwater villas.',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80',
        highlights: ['Overwater Villas', 'Coral Reefs', 'Bioluminescent Beach', 'Whale Sharks', 'Underwater Dining'],
        gallery: ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&q=80'],
        featured: false, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Japan', country: 'East Asia',
        description: 'Where ancient tradition meets cutting-edge modernity. Japan captivates with its cherry blossoms, ancient temples, buzzing cities, and exquisite cuisine.',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
        highlights: ['Cherry Blossoms', 'Mt. Fuji', 'Kyoto Temples', 'Tokyo Nightlife', 'Onsen Hot Springs'],
        gallery: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Patagonia', country: 'South America',
        description: 'The last frontier of adventure travel. Patagonia\'s dramatic glaciers, towering peaks, and windswept steppes offer a wilderness experience like no other.',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
        highlights: ['Torres del Paine', 'Perito Moreno Glacier', 'Mt. Fitz Roy', 'Beagle Channel', 'Tierra del Fuego'],
        gallery: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80'],
        featured: false, createdAt: new Date().toISOString()
      }
    ]);

    // Reviews
    _write('vs_reviews', [
      {
        id: generateId(), name: 'Sarah Mitchell', avatar: '',
        rating: 5, text: 'Our African safari with Venture Safaries was absolutely life-changing. The luxury camps, the incredible wildlife encounters, and our guide David made every moment magical. Worth every penny!',
        package: 'African Safari Expedition', date: '2025-11-15'
      },
      {
        id: generateId(), name: 'James Chen', avatar: '',
        rating: 5, text: 'The Bali retreat exceeded all expectations. From the private villa to the sunset temple visits, everything was curated to perfection. Venture Safaries truly understands luxury travel.',
        package: 'Bali Paradise Retreat', date: '2025-10-22'
      },
      {
        id: generateId(), name: 'Emma Rodriguez', avatar: '',
        rating: 4, text: 'Switzerland was a dream come true! The Glacier Express journey and paragliding over Interlaken were highlights. The only reason for 4 stars is I wanted more free time in Zermatt.',
        package: 'Swiss Alps Adventure', date: '2025-09-30'
      },
      {
        id: generateId(), name: 'Michael Okonkwo', avatar: '',
        rating: 5, text: 'I\'ve traveled with many companies, but Venture Safaries is in a league of its own. The attention to detail, the personalized service, and the breathtaking itineraries make them the best in the business.',
        package: 'Patagonia Wilderness Trek', date: '2025-08-18'
      },
      {
        id: generateId(), name: 'Aisha Patel', avatar: '',
        rating: 5, text: 'The Japan cultural odyssey was the perfect blend of tradition and modernity. Staying in a real ryokan, the tea ceremony, and the bullet train experience — absolutely unforgettable!',
        package: 'Japanese Cultural Odyssey', date: '2025-12-05'
      }
    ]);

    // FAQs
    _write('vs_faqs', [
      { id: generateId(), question: 'How do I book a package?', answer: 'Simply fill out the booking form on our website or contact us directly via phone or email. Our travel consultants will guide you through the entire booking process and customize your trip.' },
      { id: generateId(), question: 'What is your cancellation policy?', answer: 'We offer free cancellation up to 30 days before departure for a full refund. Cancellations between 15-29 days receive a 50% refund. Within 14 days, we offer trip credit valid for 12 months.' },
      { id: generateId(), question: 'Are flights included in the package price?', answer: 'International flights are not included unless specified. However, all internal flights, transfers, and ground transportation within the destination are included in every package.' },
      { id: generateId(), question: 'Do you offer group discounts?', answer: 'Yes! Groups of 4+ travelers receive 10% off, and groups of 8+ receive 15% off. We also offer exclusive private group tours with customized itineraries.' },
      { id: generateId(), question: 'What travel insurance do you recommend?', answer: 'We strongly recommend comprehensive travel insurance covering medical emergencies, trip cancellation, and lost luggage. We can arrange coverage through our partner insurers at competitive rates.' },
      { id: generateId(), question: 'Can I customize my itinerary?', answer: 'Absolutely! All our packages are fully customizable. Contact our travel consultants to add activities, extend stays, upgrade accommodations, or create a completely bespoke itinerary.' }
    ]);

    // Gallery
    _write('vs_gallery', [
      { id: generateId(), image: 'https://images.unsplash.com/photo-1516426122078-c23e76b4f964?w=600&q=80', caption: 'African Sunrise Safari', category: 'Safari' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', caption: 'Bali Temple Gates', category: 'Culture' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', caption: 'Swiss Alpine Peaks', category: 'Mountains' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80', caption: 'Maldives Crystal Waters', category: 'Beach' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80', caption: 'Kyoto Cherry Blossoms', category: 'Culture' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80', caption: 'Patagonia Wilderness', category: 'Mountains' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80', caption: 'Open Road Adventure', category: 'Adventure' },
      { id: generateId(), image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=80', caption: 'Tropical Beach Sunset', category: 'Beach' }
    ]);

    // Requests (empty to start)
    _write('vs_requests', []);

    // Mark as seeded
    _write('vs_seeded', true);
  }

  /* ─── Public API ─── */
  return {
    generateId,
    getAll,
    getById,
    create,
    update,
    remove,
    get,
    set,
    seed
  };

})();
