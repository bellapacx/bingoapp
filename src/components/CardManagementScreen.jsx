import React, { useState, useEffect } from 'react';
import ModalReport from './ModalReport';
import CardModal from './showCard';
import BingoCardCreator from './Bingoinput';

const TOTAL_CARDS = 200;
const DEFAULT_COLOR = '#3B82F6'; // blue shade

export default function CardManagementScreen({ selectedCards, setCurrentView }) {
  const [selectedCardState, setSelectedCardState] = useState([]);
  const [cardColor, setCardColor] = useState(DEFAULT_COLOR);
  const [bet, setBet] = useState(10);
  const [commission, setCommission] = useState('20%');
  const [interval, setInterval] = useState('4 sec');
  const [pattern, setPattern] = useState('All');
  const [language, setLanguage] = useState('Amharic');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showCreator, setShowCreator] = useState(false); 

  // Initialize local selected cards state from prop if present
  useEffect(() => {
    if (selectedCards && selectedCards.length > 0) {
      setSelectedCardState(selectedCards);
    }
  }, [selectedCards]);

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const shop_id = localStorage.getItem('shopid');
        const balanceRes = await fetch(`https://bingoapi-qtai.onrender.com/balance/${shop_id}`);
        if (!balanceRes.ok) throw new Error('Failed to fetch balance');
        const { balance } = await balanceRes.json();
        setBalance(balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        alert('❌ Unable to load balance.');
      }
    };
    fetchBalance();
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    setCurrentView({ name: 'login' });
  };

  // Toggle card selection
  const toggleCard = (num) => {
    setSelectedCardState((prev) => {
      const isAlreadySelected = prev.includes(num);
      if (!isAlreadySelected) {
        setSelectedCardId(num); // Open modal for this card
        // setIsModalOpen(true); // Uncomment if you want modal to open on select
        return [...prev, num];
      } else {
        return prev.filter((n) => n !== num);
      }
    });
  };

  // Close card modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardId(null);
  };

  // Calculate prize based on bet, commission, and selected cards
  const calculatePrize = () => {
    const numSelectedCards = selectedCardState.length;
    const betAmount = bet;
    const commissionRate = parseFloat(commission) / 100;

    if (numSelectedCards === 0 || betAmount <= 0) {
      return 0;
    }

    const totalBet = numSelectedCards * betAmount;
    return totalBet * (1 - commissionRate);
  };

  // Start the game
  const startGame = async () => {
    setIsLoading(true);
    const prize = calculatePrize();
    const parsedInterval = parseInt(interval.split(' ')[0]) * 1000;

    try {
      const shopId = localStorage.getItem('shopid');

      const res = await fetch("https://bingoapi-qtai.onrender.com/startgame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          bet_per_card: bet,
          commission_rate: parseFloat(commission) / 100,
          interval: parsedInterval,
          language: language,
          winning_pattern: pattern,
          prize: prize,
          total_cards: selectedCardState.length,
          selected_cards: selectedCardState,
        }),
      });

      if (!res.ok) throw new Error("Game creation failed");
      const { round_id } = await res.json();

      setCurrentView({
        name: "dashboard",
        props: {
          roundId: round_id,
          shopId,
          prize,
          selectedCards: selectedCardState,
          interval: parsedInterval,
          language,
          betPerCard: bet,
          commissionRate: parseFloat(commission) / 100,
          winningPattern: pattern,
        },
      });
    } catch (err) {
      console.error("Start Game Error:", err);
      alert("❌ Failed to start game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const shopId = localStorage.getItem('shopid');

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex overflow-hidden">
      {/* Settings Panel */}
      <aside className="w-72 bg-white/10 backdrop-blur-md p-6 flex flex-col gap-5 border-r border-white/20">
        <div className="pb-4 border-b border-white/20">
          <h2 className="text-xl font-bold mb-1 text-purple-300">Selected Cards</h2>
          <p className="text-4xl font-extrabold text-blue-400">{selectedCardState.length}</p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-2 mb-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition"
        >
          Logout
        </button>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">Card Color</label>
          <input
            type="color"
            value={cardColor}
            onChange={(e) => setCardColor(e.target.value)}
            className="w-full h-10 rounded border border-white/30 focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">Bet Per Card (ETB)</label>
          <input
            type="number"
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div
          className={`flex items-center gap-3 p-3 rounded bg-white/10 border border-white/20
          transition-filter duration-300 ${!blurred ? 'filter blur-sm' : 'filter blur-0'}`}
          style={{ maxWidth: '320px' }}
        >
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold mb-1 text-white/70 truncate">
              Commission
            </label>
            <select
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option className="bg-blue-900">20%</option>
              <option className="bg-blue-900">30%</option>
            </select>
          </div>

          <button
            onClick={() => setBlurred(!blurred)}
            className="whitespace-nowrap px-3 py-2 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 transition"
            type="button"
          >
            {blurred ? 'Unblur' : 'Blur'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">Call Interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option className="bg-blue-900">4 sec</option>
            <option className="bg-blue-900">5 sec</option>
            <option className="bg-blue-900">7 sec</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">Winning Pattern</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option className="bg-blue-900">All</option>
            <option className="bg-blue-900">1 Line</option>
            <option className="bg-blue-900">2 Lines</option>
            <option className="bg-blue-900">Four Corners</option>
            <option className="bg-blue-900">Cross</option>
            <option className="bg-blue-900">Inner Corners + Center</option>
            <option className="bg-blue-900">Full House</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option className="bg-blue-900">Amharic</option>
            <option className="bg-blue-900">English</option>
          </select>
        </div>
      </aside>

      {/* Cards Grid Panel */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 drop-shadow-md">Card Management</h1>
          <button
            className="text-lg font-semibold text-green-300 px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition"
            onClick={() => setShowReportModal(true)}
          >
            Reports
          </button>
          <button
              className="text-lg font-semibold text-blue-300 px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition"
              onClick={() => setShowCreator(true)} // <-- open creator
            >
              Create Cards
            </button>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={startGame}
            disabled={selectedCardState.length === 0}
            className={`px-8 py-3 rounded-xl font-bold text-white transition transform hover:scale-105 shadow-lg ${
              selectedCardState.length === 0
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Starting...
              </div>
            ) : (
              'Start Bingo Game'
            )}
          </button>
        </div>

        <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-16 gap-3">
          {Array.from({ length: TOTAL_CARDS }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedCardState.includes(num);
            return (
              <button
                key={num}
                onClick={() => toggleCard(num)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-lg transition-all duration-200 ease-in-out transform hover:scale-110 shadow-md ${
                  isSelected ? 'ring-3 ring-offset-2 ring-green-400 bg-green-400 scale-105' : ''
                }`}
                style={{
                  backgroundColor: isSelected ? '#32a852' : cardColor,
                  color: 'white',
                }}
              >
                {num}
              </button>
            );
          })}
        </div>
      </main>

      <ModalReport
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        shopId={shopId}
      />

      <CardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        winningCardIds={selectedCardId ? [selectedCardId] : []}
      />
      {/* NEW: Bingo Card Creator modal */}
      {showCreator && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg p-4 w-[90%] max-w-5xl h-[90%] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Bingo Card Creator</h2>
              <button
                onClick={() => setShowCreator(false)}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Close
              </button>
            </div>
            <BingoCardCreator />
          </div>
        </div>
      )}
    </div>
  );
}
