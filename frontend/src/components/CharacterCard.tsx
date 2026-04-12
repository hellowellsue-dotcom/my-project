import Link from "next/link";
import { Character } from "@/lib/characters";

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link
      href={`/chat/${character.id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-purple-200 hover:-translate-y-1"
    >
      <div className="aspect-square relative bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
        <img
          src={`/characters/${character.image}`}
          alt={character.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
          {character.name}
        </h2>
        <p className="text-sm text-gray-500 line-clamp-2">{character.personality}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {character.interests.slice(0, 2).map((interest) => (
            <span
              key={interest}
              className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
