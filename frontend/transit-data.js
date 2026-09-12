// Safar Transit AI - Transit Intelligence & GTFS-RT Data Store

window.SafarTransitData = {
  routes: [
    {
      id: "104-express",
      name: "104 Express",
      badge: "Climate AC",
      type: "bus",
      fleetUnit: "PK-889",
      model: "Safar Intercity Low-Floor 2025",
      origin: "Central Station",
      originPlatform: "Platform 2B",
      destination: "Innovation Tech Park",
      destinationStop: "Main Gate Drop",
      departureTime: "10:52 AM",
      arrivalTime: "11:18 AM",
      duration: "26 Mins",
      fare: "$2.50",
      occupancy: "64%",
      occupancyStatus: "Seats Available",
      status: "On Time",
      statusColor: "text-secondary",
      pathSummary: "Via Elevated Flyover (Bypasses downtown congestion)",
      stopsCount: 3,
      stops: [
        { name: "Central Station", platform: "Platform 2B", time: "10:52 AM", passed: false, lat: 24.8607, lng: 67.0011 },
        { name: "Metropolitan Flyover Junction", platform: "Bay 1", time: "11:04 AM", passed: false, lat: 24.8825, lng: 67.0345 },
        { name: "Innovation Tech Park", platform: "Main Gate Drop", time: "11:18 AM", passed: false, lat: 24.9120, lng: 67.0780 }
      ],
      pathCoordinates: [
        [24.8607, 67.0011],
        [24.8650, 67.0080],
        [24.8720, 67.0195],
        [24.8825, 67.0345],
        [24.8930, 67.0510],
        [24.9020, 67.0650],
        [24.9120, 67.0780]
      ],
      features: ["Climate Control AC", "Wheelchair Accessible", "Wi-Fi 6 onboard", "Tap-to-Pay RFID"]
    },
    {
      id: "local-42",
      name: "Local 42",
      badge: "Non-AC",
      type: "bus",
      fleetUnit: "PK-421",
      model: "Standard City Transporter",
      origin: "Central Station",
      originPlatform: "Bay 7",
      destination: "Innovation Tech Park",
      destinationStop: "South Gate",
      departureTime: "10:55 AM",
      arrivalTime: "11:35 AM",
      duration: "40 Mins",
      fare: "$1.50",
      occupancy: "88%",
      occupancyStatus: "Crowded",
      status: "3 min Delay",
      statusColor: "text-amber-600",
      pathSummary: "Via Surface Commercial Boulevard (Heavy traffic)",
      stopsCount: 11,
      features: ["Tap-to-Pay RFID", "CCTV Surveillance"]
    },
    {
      id: "blue-metro",
      name: "Blue Metro Line",
      badge: "Electric Rapid Transit",
      type: "train",
      fleetUnit: "MRT-204",
      model: "Alstom Metropolis 6-Car Set",
      origin: "Central Underground",
      originPlatform: "Track 1",
      destination: "Tech City Terminal",
      destinationStop: "Station 14",
      departureTime: "11:00 AM",
      arrivalTime: "11:21 AM",
      duration: "21 Mins",
      fare: "$3.00",
      occupancy: "45%",
      occupancyStatus: "Spacious",
      status: "On Time",
      statusColor: "text-secondary",
      pathSummary: "Grade-separated subterranean corridor",
      stopsCount: 6,
      features: ["Full Climate Control", "Step-free Access", "USB-C Charging", "100% Electric"]
    }
  ],

  recentChats: [
    { id: "chat-1", title: "Bus timings to Downtown", time: "2 hrs ago", preview: "Route 104 Express schedule from Central to Downtown" },
    { id: "chat-2", title: "Route 42 fare breakdown", time: "Yesterday", preview: "Fare comparison between Local 42 and Metro" },
    { id: "chat-3", title: "Live location updates", time: "2 days ago", preview: "Real-time telematics for Fleet #PK-889" },
    { id: "chat-4", title: "Platform 4 express", time: "3 days ago", preview: "Track 4 regional rail connections" }
  ],

  stations: [
    { id: "st-1", name: "Central Station", lines: ["104 Express", "Local 42", "Blue Metro"], platforms: 6, status: "Normal Service" },
    { id: "st-2", name: "Metropolitan Flyover Junction", lines: ["104 Express", "Airport Shuttle"], platforms: 2, status: "Normal Service" },
    { id: "st-3", name: "Innovation Tech Park", lines: ["104 Express", "Local 42", "Green Loop"], platforms: 4, status: "Normal Service" },
    { id: "st-4", name: "Cyber Heights", lines: ["Blue Metro"], platforms: 2, status: "Normal Service" },
    { id: "st-5", name: "Old Port Terminal", lines: ["Local 42"], platforms: 3, status: "Congested" },
    { id: "st-6", name: "University Campus", lines: ["Green Loop", "Blue Metro"], platforms: 2, status: "Normal Service" },
    { id: "st-7", name: "Civic Center Hub", lines: ["104 Express", "Blue Metro"], platforms: 4, status: "Normal Service" },
    { id: "st-8", name: "East Coast Ferry Dock", lines: ["Coastal Line"], platforms: 2, status: "Normal Service" }
  ],

  fareTable: [
    { distance: "0 - 5 km (Zone 1)", singlePass: "$1.50", dayPass: "$4.00", monthly: "$45.00" },
    { distance: "5 - 15 km (Zone 2)", singlePass: "$2.50", dayPass: "$6.50", monthly: "$65.00" },
    { distance: "15 - 30 km (Zone 3)", singlePass: "$3.50", dayPass: "$8.50", monthly: "$85.00" },
    { distance: "All-Zone Airport & Express", singlePass: "$5.00", dayPass: "$12.00", monthly: "$110.00" }
  ],

  cannedAnswers: {
    "What are the evening return trip timings?": {
      summary: "Here are the scheduled evening peak-hour return services from **Innovation Tech Park (Main Gate Drop)** back to **Central Station**:",
      sources: ["Route 104 Express Timetable", "Central Fleet Dispatch", "Evening Traffic Sensor", "Fare Matrix Zone A"],
      routeCard: {
        id: "104-return",
        name: "104 Express (Return)",
        badge: "Climate AC",
        origin: "Innovation Tech Park",
        originPlatform: "Main Gate Drop",
        destination: "Central Station",
        destinationStop: "Platform 2B",
        departureTime: "5:15 PM, 5:35 PM, 6:00 PM, 6:30 PM",
        duration: "28 Mins (Peak Traffic)",
        fare: "$2.50",
        occupancy: "High (~80%)",
        note: "Buses run every 15-20 minutes until 9:45 PM. Priority boarding available via Safar Tap-to-Pay."
      },
      followUps: [
        "Can I reserve a seat on the 5:35 PM bus?",
        "Is Metro Blue Line faster during 6:00 PM rush?",
        "Save evening return route to bookmarks"
      ]
    },

    "Alternative Blue Metro Line connection": {
      summary: "The **Blue Metro Line** offers an electric, non-stop rapid transit alternative from **Central Underground (Track 1)** to **Tech City Terminal**:",
      sources: ["Blue Metro Telematics", "Subterranean Sensor Grid", "Urban Transit Schedule", "Station 14 Telemetry"],
      routeCard: {
        id: "blue-metro",
        name: "Blue Metro Line (Rapid)",
        badge: "Electric Rapid Rail",
        origin: "Central Underground",
        originPlatform: "Track 1",
        destination: "Tech City Terminal",
        destinationStop: "Station 14 (300m walking link to Tech Park)",
        departureTime: "Departs every 6 mins",
        duration: "21 Mins",
        fare: "$3.00",
        occupancy: "45% (Ample seating)",
        note: "Zero traffic delays. Includes 3-minute high-speed walking transfer via skybridge."
      },
      followUps: [
        "How do I walk from Station 14 to Tech Park?",
        "Compare fare: Metro ($3.00) vs Route 104 ($2.50)",
        "Show Metro line map and stops"
      ]
    },

    "View full weekly transit fare table": {
      summary: "Here is the official **Safar Multimodal Transit Fare Structure** for 2026 across Bus, Metro, and Feeder shuttles:",
      isTable: true,
      sources: ["Transit Fare DB", "Ministry of Urban Transport", "RFID Discount Policy"],
      followUps: [
        "How do I recharge my Safar Card?",
        "Are there student or senior citizen discounts?",
        "What is the penalty for missed tap-out?"
      ]
    }
  }
};
