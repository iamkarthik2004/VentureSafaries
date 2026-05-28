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
    if (!force && _read('vs_seeded') && schemaVersion === '8.0') return;
    localStorage.setItem('vs_schema_version', '8.0');

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
      heroTitle: 'Discover Kerala in Ultimate Dancing-Step Tourist Buses',
      heroSubtitle: 'Kerala\'s best high-tech DJ sound system & top-light dance buses. Custom group travel packages designed perfectly for College IVs, School Excursions, and Family getaways.',
      heroImage: 'image1.jpeg',
      ctaText: 'Book Group Bus Tour',
      aboutTitle: 'Epic Kerala Group Tours & IV Excursions',
      aboutText: 'Based in the heart of Kerala, Venture Safaries is a premium travel concern by A Friends Media Center. We specialize in crafting School Excursions, College Industrial Visits (IVs), and Custom Family Trips using Kerala\'s most iconic, highly decorated, and extremely safe tourist buses.\n\nOur viral "dancing steps" buses feature top-tier DJ sound consoles, breathtaking laser light dance floors, and comfortable pushback seating. We handle everything from safe overnight logistics and accommodation bookings to custom itineraries that let students and families explore Munnar, Alappuzha backwaters, and Varkala beach cliffs in unmatched style and joy!',
      aboutImage: 'kerala_backwaters.png',
      stats: [
        { label: 'Happy Groups', value: '5,000+', icon: '🚌' },
        { label: 'Tourist Buses', value: '45+', icon: '📍' },
        { label: 'DJ Captains', value: '25+', icon: '🧭' },
        { label: 'Years Experience', value: '12+', icon: '⭐' }
      ],
      bannerImage: 'kerala_backwaters.png',
      bannerText: 'Ready for Your Next Group Adventure?',
      footerText: 'Tour Agency — ᴀ ꜰʀɪᴇɴᴅꜱ ᴍᴇᴅɪᴀ ᴄᴇɴᴛᴇʀ ᴄᴏɴᴄᴇʀɴ. Tailored Trips | Group Tours | Custom Packages. Explore.. Experience.. Enjoy.. 🌍',
      footerPhone: '9495514128 | 6238118024',
      footerEmail: 'DM or hello@venturesafaries.com',
      footerAddress: 'Kerala, India'
    });

    // Packages
    _write('vs_packages', [
      {
        id: generateId(), title: 'Munnar Hills & Tea Valley Excursion',
        destination: 'Munnar, Kerala', duration: '4 Days / 3 Nights',
        price: 5999, description: 'Hop on Kerala\'s finest high-tech tourist bus for an epic group journey through Munnar\'s mist-draped tea gardens. Enjoy late-night bus dance sessions and beautiful hill trekking.',
        image: 'image1.jpeg',
        itinerary: ['Day 1: Departure in DJ Bus & Morning Arrival in Munnar', 'Day 2: Tea Museum & Mattupetty Dam Sightseeing', 'Day 3: Eravikulam National Park Safari & Campfire', 'Day 4: Kochi Shopping & Return Journey'],
        facilities: ['Premium DJ Sound & Laser Light Bus', 'Comfortable Group Hotel Stay', 'Scenic Valley View Rooms', 'Daily Breakfast & Dinner', 'Tour Captain & Coordinator'],
        activities: ['DJ Dance Floor Session', 'Group Tea Garden Trekking', 'Boating at Kundala Lake', 'Campfire & Music Session'],
        gallery: ['image1.jpeg', 'image2.jpeg'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Kumarakom & Alappuzha Houseboat Group Cruise',
        destination: 'Kumarakom, Kerala', duration: '3 Days / 2 Nights',
        price: 7499, description: 'Travel in our spectacular dancing-steps tourist bus to Kumarakom. Board a spacious group houseboat for a scenic cruise across Vembanad Lake, complete with traditional Kerala dishes.',
        image: 'kerala_backwaters.png',
        itinerary: ['Day 1: Bus Excursion to Kumarakom & Lake Resort Check-in', 'Day 2: Boarding Spacious Group Houseboat & Backwater Cruise', 'Day 3: Alappuzha Beach Sunset & Return Drive'],
        facilities: ['Disco Lighting Tourist Bus Transfer', 'Spacious Houseboat & Lake Resort Rooms', 'Authentic Kerala Meals (All Included)', 'Friendly Crew & Coordinator', 'Mineral Water & Soft Drinks'],
        activities: ['Group Village Walk & Canoe Ride', 'Sunset Deck Dance Party', 'Traditional Fishing Experience', 'Kayaking in Backwater Canals'],
        gallery: ['kerala_backwaters.png'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Wayanad Rainforest & Cave Group Adventure',
        destination: 'Wayanad, Kerala', duration: '5 Days / 4 Nights',
        price: 9999, description: 'Bring your college IV or family group to Wayanad in our premium top-light tourist bus. Explore ancient caves, massive dams, and deep forest trails with custom DJ music onboard.',
        image: 'image2.jpeg',
        itinerary: ['Day 1: Overnight Tourist Bus Drive to Wayanad', 'Day 2: Eco-Resort Check-in & Forest Walk', 'Day 3: Edakkal Caves Exploration & Banasura Dam Visit', 'Day 4: Chembra Peak Trekking & Group BBQ Party', 'Day 5: Wildlife Safari & Return Drive'],
        facilities: ['Top-Light Dancing Steps Bus', 'Premium Group Eco-Resort Rooms', 'Trained Trekking Guides', 'All Meals Included', 'DJ System & BBQ Setup'],
        activities: ['Canopy Ziplining Excursion', 'Prehistoric Cave Hike', 'Banasura Speedboat Excursion', 'Night Campfire & DJ Jamming'],
        gallery: ['image2.jpeg', 'image1.jpeg'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Varkala Beach & Cliff Group Getaway',
        destination: 'Varkala, Kerala', duration: '4 Days / 3 Nights',
        price: 4999, description: 'Drive down the coastal highway in our vibrant tourist bus to Varkala Cliff. Perfect group getaway featuring beach sports, evening cafe hops, and amazing seaside sunset views.',
        image: 'image1.jpeg',
        itinerary: ['Day 1: Coastal Tourist Bus Drive & Varkala Check-in', 'Day 2: Beach Volleyball & Sunset Cafe Gathering', 'Day 3: Golden Island Boat Cruise & Group Dinner', 'Day 4: Shopping at Cliff & Return Drive'],
        facilities: ['High-Power Sound System Bus', 'Beachside Group Resort Rooms', 'Group Surfboard Rentals', 'Breakfast Buffet Included', 'Permits & Coordinator'],
        activities: ['Beach Volleyball & Games', 'Seaside Cliff Walk', 'Sunset Beach Cafe Hops', 'Golden Island Boat Cruise'],
        gallery: ['image1.jpeg'],
        featured: false, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Thekkady Wilds & Spice Group Trail',
        destination: 'Thekkady, Kerala', duration: '3 Days / 2 Nights',
        price: 3999, description: 'Take your student or family group into Periyar\'s spice forests. Ride our famous dancing tourist bus, boat in Periyar Lake, and experience spectacular martial arts shows.',
        image: 'image2.jpeg',
        itinerary: ['Day 1: Scenic Hills Tourist Bus Drive & Spice Farm Walk', 'Day 2: Boating in Periyar Lake & Bamboo Rafting', 'Day 3: Kalaripayattu Martial Arts & Return Drive'],
        facilities: ['Comfortable Group Bus with DJ setup', 'Forest View Resort Rooms', 'National Park Entry Fees', 'Half Board Buffet Meals', 'Local Tour Guides'],
        activities: ['Periyar Lake Boating', 'Spice Plantation Walk', 'Traditional Kalaripayattu Show', 'Late-Night DJ Party'],
        gallery: ['image2.jpeg'],
        featured: false, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), title: 'Kochi Culture & Athirappilly Waterfall Excursion',
        destination: 'Kochi & Athirappilly, Kerala', duration: '4 Days / 3 Nights',
        price: 6999, description: 'The absolute favorite school and college excursion! Witness the majestic Athirappilly waterfalls and experience the historic culture of Fort Kochi in our ultimate tourist bus.',
        image: 'image1.jpeg',
        itinerary: ['Day 1: Excursion Bus Drive to Kochi & Fort Kochi Walk', 'Day 2: Chinese Fishing Nets & Dutch Palace Excursion', 'Day 3: Drive to Athirappilly Falls & Rainforest Hike', 'Day 4: Amusement Park Visit & Return Drive'],
        facilities: ['Viral "Dancing Steps" DJ Bus', 'Group Hotel Accommodations', 'Excursion Entry Tickets', 'All Meals Included', 'Special Student/Group Captain'],
        activities: ['Waterfall Photography Trail', 'Amusement Park Rides', 'Fort Kochi Heritage Cycle', 'Dancing bus session'],
        gallery: ['image1.jpeg', 'image2.jpeg'],
        featured: true, createdAt: new Date().toISOString()
      }
    ]);

    // Destinations
    _write('vs_destinations', [
      {
        id: generateId(), name: 'Munnar', country: 'Kerala, India',
        description: 'The spectacular hill station of Kerala, renowned for its lush tea plantations, misty mountains, and cool, refreshing climate.',
        image: 'image1.jpeg',
        highlights: ['Tea Estates', 'Eravikulam Park', 'Anamudi Peak', 'Mattupetty Dam', 'Kundala Lake'],
        gallery: ['image1.jpeg', 'image2.jpeg'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Alappuzha', country: 'Kerala, India',
        description: 'Known as the Venice of the East, Alappuzha is famous for its elegant houseboats, backwater cruises, and tranquil lagoons.',
        image: 'kerala_backwaters.png',
        highlights: ['Houseboats', 'Backwater Canals', 'Alappuzha Beach', 'Punnamada Lake', 'Kuttanad Farming'],
        gallery: ['kerala_backwaters.png'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Wayanad', country: 'Kerala, India',
        description: 'A pristine mountainous plateau nestled in the Western Ghats, rich in evergreen forests, waterfalls, and ancient rock caves.',
        image: 'image2.jpeg',
        highlights: ['Chembra Peak', 'Edakkal Caves', 'Banasura Sagar', 'Pookode Lake', 'Kuruva Island'],
        gallery: ['image2.jpeg', 'image1.jpeg'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Varkala', country: 'Kerala, India',
        description: 'A breathtaking coastal town featuring dramatic red cliffs adjacent to the Arabian Sea, perfect for sunsets and beach yoga.',
        image: 'image1.jpeg',
        highlights: ['Varkala Cliff', 'Papanasam Beach', 'Janardhana Temple', 'Kavil Bhavan Yoga', 'Anjengo Fort'],
        gallery: ['image1.jpeg'],
        featured: true, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Thekkady', country: 'Kerala, India',
        description: 'Home to the Periyar National Park, offering dense evergreen forests, rich spice gardens, and regular wildlife sightings of elephants and tigers.',
        image: 'image2.jpeg',
        highlights: ['Periyar Sanctuary', 'Spice Gardens', 'Elephant Junction', 'Bamboo Rafting', 'Gavi Trekking'],
        gallery: ['image2.jpeg'],
        featured: false, createdAt: new Date().toISOString()
      },
      {
        id: generateId(), name: 'Kochi', country: 'Kerala, India',
        description: 'A historic port city blending Portuguese, Dutch, British, and Chinese influences, famous for its heritage Fort Kochi and cultural arts.',
        image: 'image1.jpeg',
        highlights: ['Chinese Fishing Nets', 'Fort Kochi Stroll', 'Jewish Synagogue', 'Dutch Palace', 'Kathakali Centre'],
        gallery: ['image1.jpeg', 'image2.jpeg'],
        featured: false, createdAt: new Date().toISOString()
      }
    ]);

    // Reviews
    _write('vs_reviews', [
      {
        id: generateId(), name: 'Aravind Nair', avatar: '',
        rating: 5, text: 'Our college IV trip to Munnar was absolutely legendary! The tourist bus had a brilliant high-bass DJ sound system and spectacular dancing lights. The dancing sessions during the journey were the absolute highlight of our trip!',
        package: 'Munnar Hills & Tea Valley Excursion', date: '2025-11-15'
      },
      {
        id: generateId(), name: 'Priya Sharma', avatar: '',
        rating: 5, text: 'Venture Safaries arranged our family group trip to Alappuzha. The kids and elders loved the spacious tourist bus with comfortable seating, and the backwater houseboat cruise was beautiful. Perfect for family trips!',
        package: 'Kumarakom & Alappuzha Houseboat Group Cruise', date: '2025-10-22'
      },
      {
        id: generateId(), name: 'Anjali Menon', avatar: '',
        rating: 5, text: 'Our school tour to Wayanad was fantastic! The tourist bus was extremely clean, safe, and the captains were very professional. The DJ lights kept all the students energized and happy throughout the drives.',
        package: 'Wayanad Rainforest & Cave Group Adventure', date: '2025-09-30'
      },
      {
        id: generateId(), name: 'David Thorne', avatar: '',
        rating: 5, text: 'Our college batch went to Varkala and Fort Kochi. The dancing-steps tourist bus was the absolute center of attraction! The sound system was pure power, and we had endless fun dancing to trending beats.',
        package: 'Kochi Culture & Athirappilly Waterfall Excursion', date: '2025-08-18'
      },
      {
        id: generateId(), name: 'Rohan Mathew', avatar: '',
        rating: 5, text: 'Organized our high school excursion to Thekkady. Safe overnight driving, great group meals, and the kids absolutely loved the DJ setup and Periyar lake boating. Best agency in Kerala for school trips!',
        package: 'Thekkady Wilds & Spice Group Trail', date: '2025-12-05'
      }
    ]);

    // FAQs
    _write('vs_faqs', [
      { id: generateId(), question: 'What kind of tourist buses do you provide for college IVs and school tours?', answer: 'We provide premium, high-tech tourist buses equipped with high-bass DJ sound consoles, spectacular laser/LED dance floors, comfortable pushback seating, full air conditioning, and viral graphic decals. We ensure your group journey is an absolute celebration!' },
      { id: generateId(), question: 'Can the students get the top light dance bus for their trip?', answer: 'Yes, absolutely! Our signature fleet features the highly popular "top-light dance buses" with integrated overhead disco lights, multi-color smoke machines, and dynamic sound-activated lighting systems that create an incredible dance party atmosphere onboard.' },
      { id: generateId(), question: 'Are these tourist buses safe for overnight student and family travel?', answer: 'Safety is our absolute priority. All buses undergo rigorous mechanical fitness checks, have active speed limiters, and are piloted by highly experienced, verified professional captains with flawless records. We also provide active GPS tracking and 24/7 helpline support.' },
      { id: generateId(), question: 'Do you offer custom itineraries for Industrial Visits (IVs)?', answer: 'Yes, we specialize in organizing custom college IVs. We handle all logistics including factory permissions, university authorization assistance, custom routes, student-friendly group stays, and local sightseeing.' },
      { id: generateId(), question: 'What is included in the package price?', answer: 'Our group packages are fully all-inclusive! The price covers your dedicated premium tourist bus, entry tickets to all sightseeing locations/parks, group hotel/resort accommodations, and all daily meals (breakfast, lunch, dinner).' }
    ]);

    // Gallery
    _write('vs_gallery', [
      { id: generateId(), image: 'image1.jpeg', caption: 'Premium Classmates DJ Tourist Bus', category: 'Our Buses' },
      { id: generateId(), image: 'image2.jpeg', caption: 'Students Group Excursion & IV Fun', category: 'Group Trips' },
      { id: generateId(), image: 'kerala_backwaters.png', caption: 'Scenic Alappuzha Houseboat Cruise', category: 'Backwaters' },
      { id: generateId(), image: 'image1.jpeg', caption: 'High-Tech Led Top-Light System', category: 'Our Buses' },
      { id: generateId(), image: 'image2.jpeg', caption: 'Dancing Steps Onboard Celebrations', category: 'Onboard DJ' },
      { id: generateId(), image: 'kerala_backwaters.png', caption: 'Sunset Backwater Group Canoeing', category: 'Adventure' },
      { id: generateId(), image: 'image1.jpeg', caption: 'Custom Decals & Aesthetic Styling', category: 'Our Buses' },
      { id: generateId(), image: 'image2.jpeg', caption: 'Memorable College IV Batches', category: 'Group Trips' }
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
