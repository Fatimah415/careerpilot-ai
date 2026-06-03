export default function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <p className="text-sm text-red-800 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
