// ================================================
// data.js — All verse references
//
// This file just stores data. No logic here.
//
// Quran refs: { s: surahNumber, a: ayahNumber }
//   Example: { s: 2, a: 255 } means Surah 2, Ayah 255
//
// Bible refs: plain text string
//   Example: "John 3:16"
// ================================================

const VERSES = {

  happy: {
    quran: [
      { s: 14, a: 7  },   // "If you are grateful, I will surely increase you"
      { s: 2,  a: 152 },  // "Remember Me and I will remember you"
      { s: 93, a: 11 },   // "Proclaim the favour of your Lord"
      { s: 55, a: 13 },   // "Which of the favours of your Lord will you deny?"
      { s: 31, a: 12 },   // "Whoever is grateful, benefits himself"
      { s: 39, a: 53 },   // "Do not despair of the mercy of Allah"
      { s: 16, a: 18 },   // "If you tried to count Allah's favours you could never number them"
      { s: 21, a: 107 },  // "We have sent you as a mercy to the worlds"
    ],
    bible: [
      "Philippians 4:4",        // "Rejoice in the Lord always"
      "Psalms 118:24",          // "This is the day the Lord has made"
      "Nehemiah 8:10",          // "The joy of the Lord is your strength"
      "Romans 15:13",           // "May the God of hope fill you with joy"
      "James 1:17",             // "Every good gift is from above"
      "Psalms 16:11",           // "You will fill me with joy in your presence"
      "1 Thessalonians 5:16",   // "Rejoice always"
      "Proverbs 17:22",         // "A cheerful heart is good medicine"
    ]
  },

  sad: {
    quran: [
      { s: 94, a: 5  },   // "With hardship will be ease"
      { s: 94, a: 6  },   // "Indeed with hardship will be ease" (repeated for emphasis)
      { s: 2,  a: 286 },  // "Allah does not burden a soul beyond that it can bear"
      { s: 65, a: 7  },   // "After hardship Allah will bring ease"
      { s: 3,  a: 139 },  // "Do not lose heart or grieve"
      { s: 12, a: 87  },  // "Do not despair of the mercy of Allah"
      { s: 13, a: 28  },  // "Hearts find rest in the remembrance of Allah"
      { s: 2,  a: 155 },  // "Give good news to the patient"
    ],
    bible: [
      "Psalms 34:18",        // "The Lord is close to the brokenhearted"
      "Matthew 5:4",         // "Blessed are those who mourn, they will be comforted"
      "Revelation 21:4",     // "He will wipe every tear from their eyes"
      "Psalms 23:4",         // "Even though I walk through the valley..."
      "2 Corinthians 1:3",   // "God of all comfort"
      "Isaiah 41:10",        // "Do not fear, for I am with you"
      "Psalms 30:5",         // "Weeping may stay for the night, but joy comes in the morning"
      "Romans 8:28",         // "All things work together for good"
    ]
  },

  anxious: {
    quran: [
      { s: 13, a: 28  },  // "Hearts find rest in the remembrance of Allah"
      { s: 2,  a: 286 },  // "Allah does not burden a soul beyond that it can bear"
      { s: 9,  a: 51  },  // "Nothing will happen to us except what Allah has decreed"
      { s: 65, a: 3   },  // "Whoever relies upon Allah, He is sufficient for him"
      { s: 3,  a: 173 },  // "Allah is sufficient for us"
      { s: 94, a: 5   },  // "With difficulty comes ease"
      { s: 2,  a: 45  },  // "Seek help through patience and prayer"
      { s: 58, a: 7   },  // "He is with you wherever you are"
    ],
    bible: [
      "Philippians 4:6",   // "Do not be anxious about anything"
      "1 Peter 5:7",       // "Cast all your anxiety on him"
      "Matthew 6:34",      // "Do not worry about tomorrow"
      "John 14:27",        // "Peace I leave with you"
      "Isaiah 26:3",       // "Perfect peace for those whose minds are steadfast"
      "Psalms 46:1",       // "God is our refuge and strength"
      "2 Timothy 1:7",     // "God has not given us a spirit of fear"
      "Matthew 11:28",     // "Come to me all who are weary"
    ]
  },

  hopeful: {
    quran: [
      { s: 39, a: 53  },  // "Do not despair of the mercy of Allah"
      { s: 94, a: 5   },  // "With hardship comes ease"
      { s: 65, a: 3   },  // "Allah will make a way out"
      { s: 93, a: 5   },  // "Your Lord will give you and you will be satisfied"
      { s: 3,  a: 200 },  // "Be patient and persevere"
      { s: 94, a: 7   },  // "When free of one burden, take on another"
      { s: 84, a: 6   },  // "You are moving towards your Lord"
      { s: 2,  a: 286 },  // "Allah intends ease for you"
    ],
    bible: [
      "Romans 15:13",          // "May the God of hope fill you with joy"
      "Jeremiah 29:11",        // "Plans to give you hope and a future"
      "Psalms 31:24",          // "Be strong, take heart, hope in the Lord"
      "Hebrews 11:1",          // "Faith is being sure of what we hope for"
      "Isaiah 40:31",          // "Those who hope in the Lord will renew their strength"
      "Romans 8:24",           // "We were saved in hope"
      "Lamentations 3:22",     // "Great is His faithfulness"
      "Psalms 42:11",          // "Put your hope in God"
    ]
  },

  grateful: {
    quran: [
      { s: 14, a: 7  },   // "If you are grateful, I will increase you"
      { s: 2,  a: 152 },  // "Remember Me and I will remember you"
      { s: 16, a: 18  },  // "You cannot count the favours of Allah"
      { s: 55, a: 13  },  // "Which of the favours of your Lord will you deny?"
      { s: 31, a: 12  },  // "Whoever is grateful, it is for himself"
      { s: 7,  a: 10  },  // "We established you on the earth"
      { s: 3,  a: 145 },  // "We will reward the grateful"
      { s: 27, a: 73  },  // "Most people are not grateful"
    ],
    bible: [
      "1 Thessalonians 5:18",  // "Give thanks in all circumstances"
      "Psalms 107:1",          // "Give thanks to the Lord for He is good"
      "Colossians 3:17",       // "Do it all in the name of Jesus, giving thanks"
      "Psalms 136:1",          // "His love endures forever"
      "Ephesians 5:20",        // "Always giving thanks"
      "Psalms 9:1",            // "I will give thanks with my whole heart"
      "2 Corinthians 9:15",    // "Thanks be to God for his indescribable gift"
      "Luke 17:16",            // "He fell at Jesus' feet, giving thanks"
    ]
  },

  fearful: {
    quran: [
      { s: 2,  a: 286 },  // "Allah does not burden beyond capacity"
      { s: 3,  a: 173 },  // "Allah is sufficient for us"
      { s: 9,  a: 51  },  // "Nothing befalls us except what Allah decrees"
      { s: 65, a: 3   },  // "Whoever trusts in Allah, He is enough"
      { s: 2,  a: 255 },  // "Ayat al-Kursi — His protection encompasses all"
      { s: 114, a: 1  },  // "I seek refuge with the Lord of mankind"
      { s: 8,  a: 40  },  // "Allah is your protector"
      { s: 112, a: 1  },  // "Say: He is Allah, the One"
    ],
    bible: [
      "Isaiah 41:10",       // "Do not fear, for I am with you"
      "Psalms 23:4",        // "I will fear no evil, for you are with me"
      "2 Timothy 1:7",      // "God has not given us a spirit of fear"
      "John 14:27",         // "Do not let your hearts be troubled"
      "Psalms 56:3",        // "When I am afraid, I put my trust in you"
      "Romans 8:31",        // "If God is for us, who can be against us?"
      "Psalms 27:1",        // "The Lord is my light and salvation"
      "Deuteronomy 31:6",   // "Be strong and courageous"
    ]
  },

  angry: {
    quran: [
      { s: 3,  a: 134 },  // "Those who restrain anger are among the righteous"
      { s: 41, a: 34  },  // "Repel evil with what is better"
      { s: 7,  a: 199 },  // "Show forgiveness and enjoin good"
      { s: 42, a: 37  },  // "Those who forgive when they are angered"
      { s: 64, a: 14  },  // "If you pardon and overlook and forgive"
      { s: 2,  a: 263 },  // "Kind speech is better than charity followed by hurt"
      { s: 16, a: 126 },  // "Be patient — that is better"
      { s: 4,  a: 149 },  // "If you pardon evil, Allah is forgiving"
    ],
    bible: [
      "Ephesians 4:26",   // "In your anger do not sin"
      "Proverbs 15:1",    // "A gentle answer turns away wrath"
      "James 1:19",       // "Be slow to speak and slow to anger"
      "Romans 12:19",     // "Do not take revenge — leave room for God"
      "Proverbs 19:11",   // "A person's wisdom yields patience"
      "Colossians 3:13",  // "Forgive as the Lord has forgiven you"
      "Matthew 5:9",      // "Blessed are the peacemakers"
      "Psalms 37:8",      // "Refrain from anger and turn from wrath"
    ]
  },

  lonely: {
    quran: [
      { s: 2,  a: 186 },  // "I am near — I respond to the one who calls"
      { s: 50, a: 16  },  // "We are closer to him than his jugular vein"
      { s: 58, a: 7   },  // "He is with you wherever you are"
      { s: 9,  a: 40  },  // "Do not grieve — Allah is with us"
      { s: 40, a: 60  },  // "Call upon Me and I will respond"
      { s: 57, a: 4   },  // "He is with you wherever you may be"
      { s: 6,  a: 103 },  // "He is the Subtle, the Acquainted"
      { s: 20, a: 46  },  // "Do not fear — I am with you both"
    ],
    bible: [
      "Psalms 139:7",      // "Where can I go from your Spirit?"
      "Matthew 28:20",     // "I am with you always"
      "Hebrews 13:5",      // "I will never leave you nor forsake you"
      "Isaiah 43:2",       // "When you pass through the waters I will be with you"
      "John 14:18",        // "I will not leave you as orphans"
      "Psalms 68:6",       // "God sets the lonely in families"
      "Romans 8:38",       // "Nothing can separate us from the love of God"
      "Deuteronomy 31:8",  // "The Lord will not leave or forsake you"
    ]
  }

};


// Emoji shown in the pill at the top of the verse screen
const MOOD_EMOJI = {
  happy:    "Happy 😊",
  sad:      "Sad 😔",
  anxious:  "Anxious 😰",
  hopeful:  "Hopeful 🌅",
  grateful: "Grateful 🤲",
  fearful:  "Fearful 😨",
  angry:    "Angry 😤",
  lonely:   "Lonely 🕊️"
};
