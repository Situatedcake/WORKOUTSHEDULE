import { User, BookOpenIcon, Settings } from "lucide-react";

export default function NavMenu() {
  return (
    <nav className="fixed bottom-0 right-0 left-0 py-4 px-12 bg-blue-400 ">
      <div className="flex justify-between items-center">
        <button>
          <User color="white" size={40} />
        </button>
        <button>
          <BookOpenIcon color="white" size={40} />
        </button>
        <button>
          <Settings color="white" size={40} />
        </button>
      </div>
    </nav>
  );
}
