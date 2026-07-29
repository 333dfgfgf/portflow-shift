export function maskPersonName(name: string): string {
  const characters = Array.from(name.trim());

  if (characters.length < 2) return name;
  if (characters.length === 2) return `${characters[0]}*`;

  return `${characters[0]}${"*".repeat(characters.length - 2)}${characters.at(-1)}`;
}
