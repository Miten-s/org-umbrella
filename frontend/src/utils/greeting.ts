type DayPart = "morning" | "afternoon" | "evening" | "night";

const greetings: Record<DayPart | "any", string[]> = {
  morning: [
    "Good morning, {name}",
    "Rise and shine, {name}",
    "Morning, {name}. Fresh start today",
    "Coffee and compliance, {name}?"
  ],
  afternoon: [
    "Good afternoon, {name}",
    "Afternoon, {name}. Let's keep it moving",
    "Hope your day's going well, {name}"
  ],
  evening: [
    "Good evening, {name}",
    "Evening, {name}. Wrapping things up?",
    "Nice to see you this evening, {name}"
  ],
  night: [
    "Working late, {name}?",
    "Hello, night owl",
    "Burning the midnight oil, {name}?"
  ],
  any: ["Welcome back, {name}", "Hey there, {name}", "Good to see you, {name}"]
};

const getDayPart = (hour: number): DayPart => {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

export const pickGreeting = (name: string) => {
  const pool = [
    ...greetings[getDayPart(new Date().getHours())],
    ...greetings.any
  ];
  return pool[Math.floor(Math.random() * pool.length)].replace("{name}", name);
};

export const formatToday = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short"
  });
