export const MadeWithDyad = () => {
  return (
    <div className="p-4 text-center">
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Made with Dyad
      </a>
      <span className="text-sm text-gray-500 dark:text-gray-400 mx-1">by</span>
      <a
        href="https://x.com/amirdev1997"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Amir Alizadeh
      </a>
      <span className="ml-1" role="img" aria-label="heart emoji">❤️</span>
    </div>
  );
};