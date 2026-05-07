const map: Record<string, string> = {
  Italian: "🇮🇹",
  French: "🇫🇷",
  Chinese: "🇨🇳",
  Korean: "🇰🇷",
  Mongolian: "🇲🇳",
};

export function cuisineEmoji(name: string) {
  return map[name] ?? "🍽️";
}
