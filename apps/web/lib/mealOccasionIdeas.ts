/** Labels must equal `tags.name` in DB (migration 0006) for `?tag=` links. */
export type MealOccasionIdea = {
  tagName: string;
  emoji: string;
  subtitle: string;
};

export const MEAL_OCCASION_IDEAS: MealOccasionIdea[] = [
  {
    tagName: "Олон хүнд (тоо тодорхойгүй)",
    emoji: "🍲",
    subtitle: "Хэдэн зочин ирэхээ мэдэхгүй үед томоохон дуншлага",
  },
  {
    tagName: "Найр, үдэшлэг",
    emoji: "🎉",
    subtitle: "Хүлээн авалт, үдэшлэг, зочлох үед",
  },
  {
    tagName: "Наадам",
    emoji: "🏇",
    subtitle: "Талбай, хөдөө, олон зочин",
  },
  {
    tagName: "Цагаан сар",
    emoji: "🌕",
    subtitle: "Шинэ жил, зочид хүлээн авах санаа",
  },
  {
    tagName: "Үндэсний баяр",
    emoji: "🇲🇳",
    subtitle: "Тэмдэглэлт өдөр, үндэсний тэмдэглэл",
  },
];
