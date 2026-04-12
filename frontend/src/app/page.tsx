import { characters } from "@/lib/characters";
import CharacterCard from "@/components/CharacterCard";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Character Chat</h1>
        <p className="text-gray-500 text-lg">대화하고 싶은 캐릭터를 선택하세요</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </main>
  );
}
