import Image from "next/image";
import { coverColors } from "@/lib/covers";

type CoverBook = {
  id: string;
  title: string;
  author?: string | null;
  cover_url: string | null;
};

const SIZES = {
  // En la lista la tapa es chica: letra más chica y menos margen para que entren las palabras largas.
  row: { box: "h-[76px] w-[52px]", w: 52, h: 76, title: "text-[7px] tracking-tight" },
  winner: { box: "h-[124px] w-[84px]", w: 84, h: 124, title: "text-sm" },
} as const;

// Portada real si el libro la tiene; si no, la tapa de color con el título.
// Es decorativa: el título siempre está escrito al lado.
export default function BookCover({
  book,
  variant,
}: {
  book: CoverBook;
  variant: keyof typeof SIZES;
}) {
  const size = SIZES[variant];

  if (book.cover_url) {
    return (
      <Image
        src={book.cover_url}
        alt=""
        width={size.w}
        height={size.h}
        unoptimized
        className={`${size.box} shrink-0 rounded-l-[3px] rounded-r-md object-cover shadow-[inset_3px_0_0_rgba(0,0,0,0.25)]`}
      />
    );
  }

  const colors = coverColors(book.id);
  return (
    <div
      aria-hidden="true"
      className={`${size.box} flex shrink-0 flex-col justify-between overflow-hidden rounded-l-[3px] rounded-r-md shadow-[inset_3px_0_0_rgba(0,0,0,0.25)] ${
        variant === "row" ? "py-1.5 pl-2 pr-1" : "p-1.5"
      }`}
      style={{ backgroundColor: colors.bg, color: colors.ink }}
    >
      <span
        className={`line-clamp-4 font-display font-extrabold uppercase leading-[1.05] ${size.title}`}
      >
        {book.title}
      </span>
      {variant === "winner" && book.author && (
        <span className="line-clamp-2 text-[9px] uppercase tracking-[0.08em]">
          {book.author}
        </span>
      )}
    </div>
  );
}
