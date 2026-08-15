const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/images/dishes');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function makeSVG(title, bgGradient, mainElements) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#122410" flood-opacity="0.15" />
    </filter>
  </defs>
  
  <!-- Background Canvas -->
  <rect width="400" height="400" fill="url(#bg)" rx="40" />
  
  <!-- Plate Base -->
  <circle cx="200" cy="200" r="160" fill="#F7FBF4" filter="url(#shadow)" stroke="#E0EED8" stroke-width="4" />
  <circle cx="200" cy="200" r="135" fill="#FFFFFF" opacity="0.6" stroke="rgba(24,54,22,0.06)" stroke-width="2" />
  
  <!-- Dish Specific Graphics -->
  <g transform="translate(200, 200)">
    ${mainElements}
  </g>

  <!-- Title Badge Overlay -->
  <rect x="20" y="340" width="360" height="42" rx="21" fill="rgba(24,54,22,0.85)" />
  <text x="200" y="366" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${title}</text>
</svg>`;
}

const dishes = {
  "protein-pancakes.svg": {
    title: "Oat Protein Pancakes",
    bg: ["#F5E6D3", "#EAD5BC"],
    elements: `
      <!-- Pancake Stack -->
      <ellipse cx="0" cy="25" rx="80" ry="24" fill="#C89658" />
      <ellipse cx="0" cy="10" rx="82" ry="24" fill="#E1AA67" />
      <ellipse cx="0" cy="-5" rx="80" ry="24" fill="#F0BE7B" />
      <!-- Butter Melt -->
      <rect x="-14" y="-22" width="28" height="14" rx="4" fill="#FFE279" />
      <!-- Berries -->
      <circle cx="-35" cy="-15" r="10" fill="#4B2C82" />
      <circle cx="-20" cy="-25" r="12" fill="#D92B4B" />
      <circle cx="25" cy="-12" r="11" fill="#4B2C82" />
      <!-- Syrup Drizzle -->
      <path d="M-40,0 Q0,20 40,-5 Q20,10 -20,15 Z" fill="#8B4513" opacity="0.6" />
    `
  },
  "steak-asparagus.svg": {
    title: "Grass-Fed Steak & Asparagus",
    bg: ["#E2EEDC", "#CDE0C3"],
    elements: `
      <!-- Asparagus Spears -->
      <rect x="-60" y="-70" width="12" height="130" rx="6" fill="#3D6B36" transform="rotate(-25)" />
      <rect x="-40" y="-75" width="12" height="130" rx="6" fill="#4D8444" transform="rotate(-20)" />
      <rect x="-20" y="-80" width="12" height="130" rx="6" fill="#3D6B36" transform="rotate(-15)" />
      <!-- Steak Strip -->
      <path d="M-50,-30 Q20,-60 80,0 Q40,60 -30,40 Z" fill="#5A2A18" />
      <path d="M-40,-20 Q20,-48 70,5 Q35,48 -20,32 Z" fill="#8B3A2B" />
      <!-- Sear Marks -->
      <line x1="-20" y1="-20" x2="20" y2="20" stroke="#33140A" stroke-width="4" stroke-linecap="round" />
      <line x1="0" y1="-30" x2="40" y2="10" stroke="#33140A" stroke-width="4" stroke-linecap="round" />
      <line x1="20" y1="-40" x2="60" y2="0" stroke="#33140A" stroke-width="4" stroke-linecap="round" />
    `
  },
  "greek-salad.svg": {
    title: "Greek Salad with Feta",
    bg: ["#EDF4EA", "#D4E5CE"],
    elements: `
      <!-- Salad Bed -->
      <circle cx="0" cy="0" r="90" fill="#5F9E43" opacity="0.8" />
      <!-- Cucumber Slices -->
      <circle cx="-40" cy="-30" r="22" fill="#78B856" stroke="#487832" stroke-width="4" />
      <circle cx="35" cy="40" r="22" fill="#78B856" stroke="#487832" stroke-width="4" />
      <!-- Tomatoes -->
      <circle cx="45" cy="-25" r="20" fill="#E63946" />
      <circle cx="-35" cy="35" r="18" fill="#E63946" />
      <!-- Feta Cubes -->
      <rect x="-15" y="-15" width="28" height="28" rx="4" fill="#FDFDFD" stroke="#E2E2E2" stroke-width="2" />
      <rect x="10" y="10" width="24" height="24" rx="4" fill="#FDFDFD" stroke="#E2E2E2" stroke-width="2" />
      <!-- Olives -->
      <circle cx="-10" cy="45" r="12" fill="#2B2D42" />
      <circle cx="15" cy="-45" r="12" fill="#2B2D42" />
    `
  },
  "teriyaki-tofu-bowl.svg": {
    title: "Teriyaki Tofu Rice Bowl",
    bg: ["#EBF3E8", "#D2E4CC"],
    elements: `
      <!-- Rice Bed -->
      <ellipse cx="0" cy="10" rx="90" ry="70" fill="#FAFBF7" />
      <!-- Tofu Cubes -->
      <rect x="-50" y="-40" width="34" height="34" rx="6" fill="#C68B45" stroke="#7A4B1A" stroke-width="3" />
      <rect x="-10" y="-55" width="34" height="34" rx="6" fill="#D99B52" stroke="#7A4B1A" stroke-width="3" />
      <rect x="25" y="-35" width="34" height="34" rx="6" fill="#C68B45" stroke="#7A4B1A" stroke-width="3" />
      <rect x="-30" y="5" width="34" height="34" rx="6" fill="#E8B068" stroke="#7A4B1A" stroke-width="3" />
      <!-- Edamame -->
      <circle cx="30" cy="20" r="10" fill="#6A9A41" />
      <circle cx="45" cy="30" r="10" fill="#6A9A41" />
      <circle cx="20" cy="38" r="10" fill="#6A9A41" />
      <!-- Sesame Sprinkles -->
      <circle cx="-10" cy="-10" r="2" fill="#122410" />
      <circle cx="10" cy="-20" r="2" fill="#122410" />
      <circle cx="0" cy="15" r="2" fill="#122410" />
    `
  },
  "tuna-lettuce-wraps.svg": {
    title: "Tuna Salad Lettuce Wraps",
    bg: ["#E8F2E3", "#CEE2C4"],
    elements: `
      <!-- Lettuce Cups -->
      <path d="M-70,-30 C-90,30 -20,80 0,60 C40,80 90,30 70,-30 C40,-70 -40,-70 -70,-30 Z" fill="#6A9A41" stroke="#3D6B36" stroke-width="4" />
      <path d="M-50,-20 C-65,20 -15,55 0,45 C30,55 65,20 50,-20 C30,-50 -30,-50 -50,-20 Z" fill="#88B85C" />
      <!-- Tuna Mix -->
      <ellipse cx="0" cy="-5" rx="45" ry="30" fill="#E59B8E" />
      <!-- Celery & Herbs -->
      <circle cx="-15" cy="-15" r="5" fill="#47603D" />
      <circle cx="15" cy="5" r="5" fill="#47603D" />
      <circle cx="0" cy="-10" r="4" fill="#3D6B36" />
    `
  },
  "mango-chia-pudding.svg": {
    title: "Mango Chia Seed Pudding",
    bg: ["#FDF3E3", "#F5E2C4"],
    elements: `
      <!-- Jar Base -->
      <rect x="-45" y="-70" width="90" height="130" rx="20" fill="#F4F8F1" stroke="#DCEAD4" stroke-width="4" />
      <!-- Chia Layer -->
      <rect x="-41" y="-10" width="82" height="66" rx="14" fill="#EAF1E5" />
      <circle cx="-20" cy="10" r="2" fill="#122410" />
      <circle cx="10" cy="25" r="2" fill="#122410" />
      <circle cx="-10" cy="40" r="2" fill="#122410" />
      <circle cx="20" cy="0" r="2" fill="#122410" />
      <!-- Mango Layer -->
      <rect x="-41" y="-66" width="82" height="52" rx="14" fill="#FFAA00" />
      <!-- Mint Topping -->
      <path d="M0,-66 C-15,-85 0,-95 0,-66 Z" fill="#3D6B36" />
      <path d="M0,-66 C15,-85 0,-95 0,-66 Z" fill="#6A9A41" />
    `
  },
  "turkey-sweet-potato.svg": {
    title: "Turkey Breast & Sweet Potato",
    bg: ["#F5EBE1", "#E5D4C3"],
    elements: `
      <!-- Turkey Slices -->
      <ellipse cx="-25" cy="-20" rx="45" ry="28" fill="#E2C4A6" stroke="#B89472" stroke-width="3" />
      <ellipse cx="-15" cy="10" rx="45" ry="28" fill="#EAD5BE" stroke="#B89472" stroke-width="3" />
      <!-- Sweet Potato Cubes -->
      <rect x="20" y="-45" width="28" height="28" rx="6" fill="#FF7B00" />
      <rect x="35" y="-15" width="26" height="26" rx="6" fill="#E66E00" />
      <rect x="15" y="15" width="28" height="28" rx="6" fill="#FF7B00" />
      <!-- Broccoli -->
      <circle cx="-40" cy="35" r="16" fill="#3D6B36" />
      <circle cx="-20" cy="45" r="14" fill="#6A9A41" />
    `
  },
  "shrimp-avocado-bowl.svg": {
    title: "Grilled Shrimp Fiesta Bowl",
    bg: ["#E8F3E5", "#D2E4CB"],
    elements: `
      <!-- Rice Bed -->
      <ellipse cx="0" cy="10" rx="85" ry="65" fill="#F4F8F1" />
      <!-- Shrimps -->
      <path d="M-40,-30 C-60,-50 -20,-65 -10,-45 C-5,-35 -25,-25 -40,-30 Z" fill="#FF6F59" stroke="#E0462E" stroke-width="2" />
      <path d="M0,-40 C-20,-60 20,-75 30,-55 C35,-45 15,-35 0,-40 Z" fill="#FF6F59" stroke="#E0462E" stroke-width="2" />
      <path d="M30,-20 C10,-40 50,-55 60,-35 C65,-25 45,-15 30,-20 Z" fill="#FF6F59" stroke="#E0462E" stroke-width="2" />
      <!-- Avocado Slices -->
      <path d="M-50,0 C-70,30 -30,60 -10,30 Z" fill="#6A9A41" stroke="#3D6B36" stroke-width="3" />
      <path d="M-30,15 C-50,45 -10,75 10,45 Z" fill="#88B85C" stroke="#3D6B36" stroke-width="3" />
    `
  },
  "spinach-egg-omelet.svg": {
    title: "Spinach Egg White Omelet",
    bg: ["#F9F4E6", "#EDE0C7"],
    elements: `
      <!-- Omelet Fold -->
      <path d="M-80,-20 C-80,60 80,60 80,-20 C60,-50 -60,-50 -80,-20 Z" fill="#FFE89C" stroke="#E6C865" stroke-width="4" />
      <path d="M-60,-10 C-60,40 60,40 60,-10 Z" fill="#FFF2C6" />
      <!-- Spinach Leaves Inside -->
      <path d="M-30,-5 C-45,15 -20,25 -10,5 Z" fill="#3D6B36" />
      <path d="M10,0 C-5,20 20,30 30,10 Z" fill="#6A9A41" />
      <path d="M-10,-20 C-25,0 0,10 10,-10 Z" fill="#3D6B36" />
    `
  },
  "green-detox-smoothie.svg": {
    title: "Green Goddess Detox Smoothie",
    bg: ["#E5F2E0", "#CBE3C3"],
    elements: `
      <!-- Glass Cup -->
      <rect x="-40" y="-70" width="80" height="130" rx="16" fill="#F4F8F1" stroke="#DCEAD4" stroke-width="4" />
      <!-- Green Liquid -->
      <rect x="-36" y="-55" width="72" height="110" rx="12" fill="#5F9E43" />
      <!-- Straw -->
      <rect x="10" y="-100" width="8" height="120" rx="4" fill="#E63946" transform="rotate(12)" />
      <!-- Mint Garnish -->
      <path d="M-15,-60 C-35,-80 -10,-90 -5,-65 Z" fill="#3D6B36" />
      <path d="M5,-60 C25,-80 0,-90 -5,-65 Z" fill="#6A9A41" />
    `
  },
  "roasted-veggie-bowl.svg": {
    title: "Mediterranean Harvest Bowl",
    bg: ["#ECE5D8", "#DCD0BB"],
    elements: `
      <!-- Grain Base -->
      <circle cx="0" cy="0" r="85" fill="#D4B68B" />
      <!-- Zucchini & Aubergine -->
      <circle cx="-35" cy="-35" r="22" fill="#3D6B36" stroke="#264E23" stroke-width="3" />
      <circle cx="35" cy="-35" r="22" fill="#4B2C82" stroke="#2D1952" stroke-width="3" />
      <circle cx="-35" cy="35" r="22" fill="#D9931E" stroke="#A66C0F" stroke-width="3" />
      <circle cx="35" cy="35" r="22" fill="#C85333" stroke="#8F341B" stroke-width="3" />
      <!-- Chickpeas Center -->
      <circle cx="0" cy="0" r="10" fill="#E5C17C" />
      <circle cx="-12" cy="5" r="9" fill="#E5C17C" />
      <circle cx="12" cy="-5" r="9" fill="#E5C17C" />
    `
  },
  "peanut-butter-shake.svg": {
    title: "Peanut Butter Protein Shake",
    bg: ["#F5E8D8", "#E6CFB8"],
    elements: `
      <!-- Glass Cup -->
      <rect x="-40" y="-70" width="80" height="130" rx="16" fill="#FBF7F0" stroke="#E5D8C5" stroke-width="4" />
      <!-- PB Smoothie Liquid -->
      <rect x="-36" y="-55" width="72" height="110" rx="12" fill="#C89658" />
      <!-- Whipped Cream Top -->
      <ellipse cx="0" cy="-60" rx="38" ry="16" fill="#FFFDF8" />
      <!-- Banana Slice -->
      <circle cx="-15" cy="-62" r="10" fill="#FFE279" stroke="#D4B642" stroke-width="2" />
    `
  },
  "baked-cod-spinach.svg": {
    title: "Garlic Baked Cod & Spinach",
    bg: ["#EAF3E6", "#CEE2C4"],
    elements: `
      <!-- Spinach Bed -->
      <ellipse cx="0" cy="15" rx="85" ry="55" fill="#3D6B36" />
      <!-- White Cod Fillet -->
      <path d="M-60,-25 Q0,-55 60,-25 Q40,25 -60,-5 Z" fill="#F7FBF4" stroke="#DCEAD4" stroke-width="3" />
      <!-- Lemon Slice -->
      <path d="M-10,-20 A18,18 0 0,1 25,-20 Z" fill="#FFE279" stroke="#D4B642" stroke-width="2" />
      <!-- Herb Flakes -->
      <circle cx="-30" cy="-15" r="3" fill="#6A9A41" />
      <circle cx="20" cy="-10" r="3" fill="#6A9A41" />
    `
  },
  "yogurt-parfait.svg": {
    title: "Greek Yogurt Berry Parfait",
    bg: ["#F7ECEB", "#ECCECB"],
    elements: `
      <!-- Parfait Glass -->
      <rect x="-38" y="-75" width="76" height="140" rx="18" fill="#FFFFFF" opacity="0.8" stroke="#EAD5D3" stroke-width="4" />
      <!-- Layers -->
      <rect x="-34" y="30" width="68" height="30" fill="#E63946" /> <!-- Berry bottom -->
      <rect x="-34" y="0" width="68" height="30" fill="#FDFDFD" /> <!-- Yogurt -->
      <rect x="-34" y="-30" width="68" height="30" fill="#D4B68B" /> <!-- Granola -->
      <rect x="-34" y="-60" width="68" height="30" fill="#FDFDFD" /> <!-- Yogurt top -->
      <!-- Strawberries on Top -->
      <circle cx="-12" cy="-68" r="10" fill="#E63946" />
      <circle cx="12" cy="-68" r="8" fill="#4B2C82" />
    `
  },
  "beef-burrito-bowl.svg": {
    title: "Lean Beef Burrito Bowl",
    bg: ["#EFE6DC", "#DCC9B5"],
    elements: `
      <!-- Rice & Beans Base -->
      <circle cx="0" cy="0" r="85" fill="#FAFBF7" />
      <!-- Beef Grounds -->
      <ellipse cx="-30" cy="-20" rx="40" ry="30" fill="#5A2A18" />
      <!-- Black Beans -->
      <circle cx="30" cy="-30" r="8" fill="#212529" />
      <circle cx="45" cy="-20" r="8" fill="#212529" />
      <circle cx="25" cy="-10" r="8" fill="#212529" />
      <!-- Guacamole Scoop -->
      <circle cx="0" cy="30" r="28" fill="#6A9A41" stroke="#3D6B36" stroke-width="3" />
      <!-- Salsa Corn -->
      <circle cx="-35" cy="25" r="7" fill="#E63946" />
      <circle cx="35" cy="25" r="7" fill="#FFB703" />
    `
  },
  "edamame-sesame-salad.svg": {
    title: "Asian Edamame Sesame Salad",
    bg: ["#E8F2E3", "#CCE2C3"],
    elements: `
      <!-- Cabbage Bed -->
      <circle cx="0" cy="0" r="85" fill="#6C5A99" />
      <!-- Edamame Pods & Beans -->
      <circle cx="-35" cy="-25" r="14" fill="#6A9A41" stroke="#3D6B36" stroke-width="2" />
      <circle cx="-15" cy="-40" r="14" fill="#6A9A41" stroke="#3D6B36" stroke-width="2" />
      <circle cx="20" cy="-25" r="14" fill="#6A9A41" stroke="#3D6B36" stroke-width="2" />
      <circle cx="35" cy="-10" r="14" fill="#6A9A41" stroke="#3D6B36" stroke-width="2" />
      <!-- Almond Slices -->
      <ellipse cx="-20" cy="25" rx="16" ry="8" fill="#D4B68B" transform="rotate(30)" />
      <ellipse cx="20" cy="30" rx="16" ry="8" fill="#D4B68B" transform="rotate(-30)" />
    `
  },
  "cottage-cheese-plate.svg": {
    title: "Cottage Cheese & Peach Plate",
    bg: ["#F9F0E6", "#EED8C3"],
    elements: `
      <!-- Cottage Cheese Curds -->
      <circle cx="-25" cy="0" r="45" fill="#FDFDFD" stroke="#E2E2E2" stroke-width="3" />
      <circle cx="-35" cy="-15" r="12" fill="#F4F8F1" />
      <circle cx="-15" cy="15" r="14" fill="#F4F8F1" />
      <!-- Peach Wedges -->
      <path d="M10,-45 C40,-55 65,-25 45,10 C30,-10 10,-30 10,-45 Z" fill="#FF7B00" stroke="#E65100" stroke-width="2" />
      <path d="M25,-20 C55,-30 75,0 55,35 C40,15 25,-5 25,-20 Z" fill="#FFAA00" stroke="#E65100" stroke-width="2" />
    `
  },
  "chickpea-power-bowl.svg": {
    title: "Crispy Chickpea Power Bowl",
    bg: ["#ECE5D8", "#DCD0BB"],
    elements: `
      <!-- Quinoa Base -->
      <circle cx="0" cy="0" r="85" fill="#E5C17C" />
      <!-- Roasted Chickpeas -->
      <circle cx="-40" cy="-30" r="12" fill="#C88A32" />
      <circle cx="-20" cy="-45" r="12" fill="#C88A32" />
      <circle cx="0" cy="-30" r="12" fill="#D99B43" />
      <circle cx="25" cy="-40" r="12" fill="#C88A32" />
      <circle cx="-30" cy="0" r="12" fill="#D99B43" />
      <circle cx="-10" cy="15" r="12" fill="#C88A32" />
      <!-- Parsley -->
      <path d="M20,20 C10,40 40,50 35,25 Z" fill="#3D6B36" />
      <path d="M35,10 C20,30 50,35 45,15 Z" fill="#6A9A41" />
    `
  },
  "watermelon-feta-salad.svg": {
    title: "Fresh Watermelon & Feta Salad",
    bg: ["#F9ECEC", "#EFC8C8"],
    elements: `
      <!-- Watermelon Cubes -->
      <rect x="-55" y="-35" width="34" height="34" rx="6" fill="#E63946" />
      <rect x="-15" y="-55" width="34" height="34" rx="6" fill="#FF4D5A" />
      <rect x="20" y="-30" width="34" height="34" rx="6" fill="#E63946" />
      <rect x="-35" y="10" width="34" height="34" rx="6" fill="#FF4D5A" />
      <rect x="10" y="15" width="34" height="34" rx="6" fill="#E63946" />
      <!-- Feta Crumbles -->
      <rect x="-20" y="-10" width="14" height="14" rx="3" fill="#FFFFFF" />
      <rect x="15" y="-5" width="14" height="14" rx="3" fill="#FFFFFF" />
      <rect x="-5" y="35" width="14" height="14" rx="3" fill="#FFFFFF" />
      <!-- Mint Leaves -->
      <path d="M-40,-55 C-50,-70 -30,-70 -35,-55 Z" fill="#3D6B36" />
      <path d="M40,-50 C30,-65 50,-65 45,-50 Z" fill="#6A9A41" />
    `
  },
  "almond-chia-toast.svg": {
    title: "Almond Butter Banana Toast",
    bg: ["#F5E8D8", "#E8D3BC"],
    elements: `
      <!-- Sourdough Slice -->
      <path d="M-75,-50 C-75,-75 75,-75 75,-50 C80,30 70,60 60,65 C-60,65 -70,30 -75,-50 Z" fill="#C89658" stroke="#7A4B1A" stroke-width="4" />
      <path d="M-65,-45 C-65,-65 65,-65 65,-45 C70,25 60,50 50,55 C-50,55 -60,25 -65,-45 Z" fill="#A86B32" />
      <!-- Banana Slices -->
      <circle cx="-30" cy="-20" r="18" fill="#FFE279" stroke="#D4B642" stroke-width="2" />
      <circle cx="20" cy="-20" r="18" fill="#FFE279" stroke="#D4B642" stroke-width="2" />
      <circle cx="-5" cy="15" r="18" fill="#FFE279" stroke="#D4B642" stroke-width="2" />
      <!-- Chia Sprinkle -->
      <circle cx="-30" cy="-20" r="2" fill="#122410" />
      <circle cx="20" cy="-20" r="2" fill="#122410" />
      <circle cx="-5" cy="15" r="2" fill="#122410" />
    `
  }
};

Object.entries(dishes).forEach(([filename, data]) => {
  const content = makeSVG(data.title, data.bg, data.elements);
  fs.writeFileSync(path.join(outDir, filename), content);
  console.log(`Created ${filename}`);
});
