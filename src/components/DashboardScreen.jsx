import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'react-feather';
import WinningCardsModal from './WinningcardsModal';
import { submitWinning } from '../service/api'; // Adjust the import path as necessary
import bingoCardsData from '../data/bingoCards.json'; // Ensure this path is correct

const NUMBER_RANGE = Array.from({ length: 75 }, (_, i) => i + 1);
const CATEGORIES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

const getCategory = (num) => {
  for (const [key, [min, max]] of Object.entries(CATEGORIES)) {
    if (num >= min && num <= max) return key;
  }
  return '';
};

// Enhanced category colors with gradients and glows for a more beautiful grid
const categoryColors = {
  B: 'bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 text-blue-50 border-blue-400 shadow-blue-300/30',
  I: 'bg-gradient-to-br from-pink-400 via-pink-600 to-pink-800 text-pink-50 border-pink-400 shadow-pink-300/30',
  N: 'bg-gradient-to-br from-purple-500 via-purple-700 to-purple-900 text-purple-50 border-purple-400 shadow-purple-300/30',
  G: 'bg-gradient-to-br from-green-500 via-green-700 to-green-900 text-green-50 border-green-400 shadow-green-300/30',
  O: 'bg-gradient-to-br from-amber-400 via-orange-600 to-orange-900 text-amber-50 border-amber-400 shadow-orange-300/30',
};

// Converts a number (1-75) to Amharic words
const amharicNumbers = [
  '', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ', 'አስር',
  'አስራ አንድ', 'አስራ ሁለት', 'አስራ ሶስት', 'አስራ አራት', 'አስራ አምስት', 'አስራ ስድስት', 'አስራ ሰባት', 'አስራ ስምንት', 'አስራ ዘጠኝ',
  'ሃያ', 'ሃያ አንድ', 'ሃያ ሁለት', 'ሃያ ሶስት', 'ሃያ አራት', 'ሃያ አምስት', 'ሃያ ስድስት', 'ሃያ ሰባት', 'ሃያ ስምንት', 'ሃያ ዘጠኝ',
  'ሰላሳ', 'ሰላሳ አንድ', 'ሰላሳ ሁለት', 'ሰላሳ ሶስት', 'ሰላሳ አራት', 'ሰላሳ አምስት', 'ሰላሳ ስድስት', 'ሰላሳ ሰባት', 'ሰላሳ ስምንት', 'ሰላሳ ዘጠኝ',
  'አርባ', 'አርባ አንድ', 'አርባ ሁለት', 'አርባ ሶስት', 'አርባ አራት', 'አርባ አምስት', 'አርባ ስድስት', 'አርባ ሰባት', 'አርባ ስምንት', 'አርባ ዘጠኝ',
  'ሃምሳ', 'ሃምሳ አንድ', 'ሃምሳ ሁለት', 'ሃምሳ ሶስት', 'ሃምሳ አራት', 'ሃምሳ አምስት', 'ሃምሳ ስድስት', 'ሃምሳ ሰባት', 'ሃምሳ ስምንት', 'ሃምሳ ዘጠኝ',
  'ስልሳ', 'ስልሳ አንድ', 'ስልሳ ሁለት', 'ስልሳ ሶስት', 'ስልሳ አራት', 'ስልሳ አምስት', 'ስልሳ ስድስት', 'ስልሳ ሰባት', 'ስልሳ ስምንት', 'ስልሳ ዘጠኝ',
  'ሰባ', 'ሰባ አንድ', 'ሰባ ሁለት', 'ሰባ ሶስት', 'ሰባ አራት', 'ሰባ አምስት'
];

function getAmharicNumber(num) {
  return amharicNumbers[num] || num.toString();
}

export default function DashboardScreen({
  roundId,
  shopId,
  prize,
  selectedCards,
  interval,
  language, // This prop now controls voice language
  betPerCard,
  commissionRate,
  winningPattern,
  setCurrentView,
}) {
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [winningCards, setWinningCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualCardId, setManualCardId] = useState('');
  const [mode, setMode] = useState('auto');
  const [status, setStatus] = useState("won");

  // State and ref for speech synthesis
  const speechUtteranceRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  

  // --- Speech Synthesis Setup ---
  useEffect(() => {
    // Initialize SpeechSynthesisUtterance only once
    if (!speechUtteranceRef.current) {
      speechUtteranceRef.current = new SpeechSynthesisUtterance();
      speechUtteranceRef.current.volume = 1;
      speechUtteranceRef.current.rate = 1;
      speechUtteranceRef.current.pitch = 1;
    }

    const populateVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    // Populate voices immediately if available
    populateVoices();

    // Listen for voices changed event (voices might load asynchronously or after user interaction)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    return () => {
      // Clean up the listener when the component unmounts
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []); // Runs once on mount

  // Effect to speak the current number when it changes
  useEffect(() => {
    if (currentCall !== null && speechUtteranceRef.current && availableVoices.length > 0) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech to avoid overlap

      const category = getCategory(currentCall);
      // Format the text to be spoken: "B. one." or "N. thirty-five."
      let textToSpeak;
      if (language === 'Amharic') {
        textToSpeak = `${category}. ${getAmharicNumber(currentCall)}.`;
      } else {
        textToSpeak = `${category}. ${currentCall}.`;
      }

      speechUtteranceRef.current.text = textToSpeak;

      // Determine the desired language prefix/tag based on your prop
      const voiceLangPrefix = (() => {
        switch (language) {
          case 'Amharic': return 'am'; // For Amharic (e.g., 'am-ET')
          case 'ti': return 'ti'; // For Tigrigna (e.g., 'ti-ET' or 'ti-ER')
          case 'en':
          default: return 'en'; // Default to English
        }
      })();

      // Try to find a suitable voice that starts with the desired language prefix
      const selectedVoice = availableVoices.find(voice =>
        voice.lang.startsWith(voiceLangPrefix) &&
        (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default) // Prioritize common vendors or default voices
      );

      if (selectedVoice) {
        speechUtteranceRef.current.voice = selectedVoice;
        speechUtteranceRef.current.lang = selectedVoice.lang; // Use the exact lang of the found voice
      } else {
        // Fallback: If no specific voice for the requested language is found, use English.
        speechUtteranceRef.current.lang = 'en-US';
        console.warn(`No specific voice found for language '${language}' (${voiceLangPrefix}). Falling back to 'en-US'.`);
      }

      try {
        window.speechSynthesis.speak(speechUtteranceRef.current);
      } catch (e) {
        console.error("Speech synthesis failed:", e);
        // This might happen if speech is not yet "activated" by user interaction
        // or if there are truly no voices available.
      }
    }
  }, [currentCall, language, availableVoices]); // Dependencies for this effect


  // Helper function to convert card object to a 5x5 grid array (handling null for free space)
  const getCardGrid = (card) => {
    const grid = [];
    const columns = ['B', 'I', 'N', 'G', 'O'];
    for (let i = 0; i < 5; i++) {
      grid.push([]);
      for (let j = 0; j < 5; j++) {
        grid[i].push(card[columns[j]][i]);
      };
    }
    return grid;
  };

  // Helper to check if a number on a card is considered "marked" (called or free space)
  const isMarked = (num, calledNumbersSet) => {
    return num === null || calledNumbersSet.has(num);
  };

  // Check for lines (rows, columns, diagonals) completed on a card
  const checkLinesOnCard = (grid, calledNumbersSet) => {
    let linesWon = 0;

    // Check Rows
    for (let i = 0; i < 5; i++) {
      if (grid[i].every(num => isMarked(num, calledNumbersSet))) {
        linesWon++;
      }
    }

    // Check Columns
    for (let j = 0; j < 5; j++) {
      let colComplete = true;
      for (let i = 0; i < 5; i++) {
        if (!isMarked(grid[i][j], calledNumbersSet)) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) {
        linesWon++;
      }
    }

    // Check Diagonals
    let diag1Complete = true; // Top-left to bottom-right
    for (let i = 0; i < 5; i++) {
      if (!isMarked(grid[i][i], calledNumbersSet)) {
        diag1Complete = false;
        break;
      }
    }
    if (diag1Complete) {
      linesWon++;
    }

    let diag2Complete = true; // Top-right to bottom-left
    for (let i = 0; i < 5; i++) {
      if (!isMarked(grid[i][4 - i], calledNumbersSet)) {
        diag2Complete = false;
        break;
      }
    }
    if (diag2Complete) {
      linesWon++;
    }

    return linesWon;
  };

  // Check for Full House win
  const checkFullHouseWin = (grid, calledNumbersSet) => {
    return grid.flat().every(num => isMarked(num, calledNumbersSet));
  };


 // Main win checking function
const checkWin = async () => {
  if (mode === 'manual') return;
  if (!calledNumbers.length) return;
  if (winningCards.length > 0) return;
  
  const currentCalledNumbersSet = new Set(calledNumbers);

  const cardsToCheck = bingoCardsData.filter(card => selectedCards.includes(card.card_id));
  let declaredWinnerCardId = null;

  for (const card of cardsToCheck) {
    const cardGrid = getCardGrid(card);
    let isWinner = false;

    switch (winningPattern) {
      case '1 Line':
        if (checkLinesOnCard(cardGrid, currentCalledNumbersSet) >= 1) {
          isWinner = true;
        }
        break;
      case '2 Lines':
        if (checkLinesOnCard(cardGrid, currentCalledNumbersSet) >= 2) {
          isWinner = true;
        }
        break;
      case 'Full House':
        if (checkFullHouseWin(cardGrid, currentCalledNumbersSet)) {
          isWinner = true;
        }
        break;
      default:
        console.warn(`Unknown winning pattern: ${winningPattern}`);
        break;
    }

    if (isWinner) {
      declaredWinnerCardId = card.card_id;
      break;
    }
  }

  if (declaredWinnerCardId !== null) {
    console.log(`Winner found: Card ID ${declaredWinnerCardId}`);

    try {
      const response = await submitWinning({
        cardId: declaredWinnerCardId,
        roundId: roundId,
        shopId,
        prize,
      });
      console.log('Winning submission response:', response);
      
      setIsRunning(false);
      setWinningCards([declaredWinnerCardId]);
      setIsModalOpen(true);
      window.speechSynthesis.cancel(); // Stop speech immediately on win
    } catch (error) {
      console.error('Error submitting winning:', error);
      alert('Failed to submit winning. Please try again.');
    }
  }
};
//manual check function
const handleManualCheck = async () => {
  if (!manualCardId) {
    alert("Please enter a Card ID.");
    return;
  }

  if (!calledNumbers.length) {
    alert("No called numbers yet. Cannot check.");
    return;
  }

 const normalizedManualId = Number(manualCardId.trim());

 const selectedCardsData = bingoCardsData.filter(card => selectedCards.includes(card.card_id));
const card = selectedCardsData.find(c => c.card_id === normalizedManualId);

if (!card) {
  alert("Card ID not found in selected cards.");
  return;
}


  const currentCalledNumbersSet = new Set(calledNumbers);
  const cardGrid = getCardGrid(card);
  let isWinner = false;

  switch (winningPattern) {
    case '1 Line':
      isWinner = checkLinesOnCard(cardGrid, currentCalledNumbersSet) >= 1;
      break;
    case '2 Lines':
      isWinner = checkLinesOnCard(cardGrid, currentCalledNumbersSet) >= 2;
      break;
    case 'Full House':
      isWinner = checkFullHouseWin(cardGrid, currentCalledNumbersSet);
      break;
    default:
      alert("Invalid winning pattern.");
      return;
  }

  if (isWinner) {
    console.log(`Manual winner found: Card ID ${manualCardId}`);

    try {
      const response = await submitWinning({
        cardId: manualCardId,
        roundId,   // make sure roundId is defined in your component scope
        shopId,    // make sure shopId is defined as well
        prize,     // prize should also be defined properly
      });
      console.log('Manual winning submission response:', response);
      setStatus("won");
      setIsRunning(false);
      setWinningCards([normalizedManualId]);
      setIsModalOpen(true);
      window.speechSynthesis.cancel();
    } catch (error) {
      console.error('Error submitting manual winning:', error);
      alert('Failed to submit manual winning.');
    }
  } else {
    setStatus("failed"); // 👈 set status
  setIsModalOpen(true);
    alert("This card is NOT a winner based on current numbers.");
  }
};


  const callNextNumber = () => {
    const remaining = NUMBER_RANGE.filter((n) => !calledNumbers.includes(n));
    if (remaining.length === 0) {
      setIsRunning(false);
      return;
    }
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    setCalledNumbers((prev) => [next, ...prev]);
    setCurrentCall(next);
    // Check for wins after state updates have potentially rendered the new number
    // using setTimeout(0) or by making checkWin part of an effect for calledNumbers.
    // For simplicity, we keep setTimeout(0) here.
    setTimeout(checkWin, 0);
  };

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => callNextNumber(), interval);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, calledNumbers, interval]);

  const togglePlayPause = () => {
    // Crucial for browser speech policies: a user gesture often required.
    // If not running and it's the first call, make a dummy speech attempt
    // to "activate" speech synthesis, which will then allow subsequent calls to play.
    if (!isRunning && currentCall === null && speechUtteranceRef.current) {
        const dummyUtterance = new SpeechSynthesisUtterance(' ');
        window.speechSynthesis.speak(dummyUtterance);
    }
    setIsRunning((prev) => !prev);
  };

  const restartGame = () => {
    setIsRunning(false);
    setCalledNumbers([]);
    setCurrentCall(null);
    setWinningCards([]);
    setIsModalOpen(false);
    setCurrentView('card_management');
    window.speechSynthesis.cancel(); // Stop any speech on restart
  };

  const requestFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-4">
        <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-lg tracking-wide">
          HaloBingo 
        </h1>
        <div className="flex items-center space-x-6">
          <div className="text-white/80 font-medium text-xl flex items-center">
            <span className="text-blue-300 mr-2">Calls:</span> {calledNumbers.length}/75
          </div>
          <div className="text-green-300 font-bold text-2xl flex items-center">
            <span className="text-purple-300 mr-2">Prize:</span> {prize.toFixed(2)} ETB
          </div>
          {winningCards.length > 0 && (
            <div className="text-red-400 font-bold text-2xl flex items-center">
              <span className="text-red-300 mr-2">Winners:</span> {winningCards.length}
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-8 h-[calc(100vh-160px)]">
        {/* Left Panel */}
        <div className="w-80 bg-white/5 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between shadow-xl border border-white/10">
          <div>
            <div className="text-sm mb-2 text-white/60">Current Call</div>
            <div className="bg-gradient-to-br from-purple-800 to-blue-800 text-yellow-300 rounded-xl p-8 text-center text-7xl font-extrabold tracking-widest shadow-2xl animate-pulse-once border border-purple-700">
              {currentCall
                ? `${getCategory(currentCall)}${currentCall.toString().padStart(2, '0')}`
                : '---'}
            </div>
          </div>

          <div>
            <div className="text-lg mb-3 text-white/70 font-semibold">Last 5 Called Numbers</div>
            <div className="grid grid-cols-5 gap-3">
              {[...calledNumbers.slice(0, 5)].map((n, i) => (
                <div
                  key={i}
                  className="text-center p-3 bg-white/10 rounded-lg text-lg font-bold border border-white/20 shadow-inner"
                >
                  {n ? n.toString().padStart(2, '0') : '--'}
                </div>
              ))}
              {Array(Math.max(0, 5 - calledNumbers.length))
                .fill(null)
                .map((_, i) => (
                  <div
                    key={`filler-${i}`}
                    className="text-center p-3 bg-white/10 rounded-lg text-lg font-bold border border-white/20 shadow-inner"
                  >
                    --
                  </div>
                ))}
            </div>
          </div>
          <div className="mt-6 mb-2 p-4 border border-white/20 rounded-md bg-white/5 max-w-md w-full" style={{ minWidth: 0 }}>
  <div className="mb-4 flex items-center gap-6 text-white font-medium">
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        checked={mode === 'auto'}
        onChange={() => setMode('auto')}
        className="form-radio text-yellow-400"
      />
      Auto
    </label>
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        checked={mode === 'manual'}
        onChange={() => setMode('manual')}
        className="form-radio text-yellow-400"
      />
      Manual
    </label>
  </div>

  {mode === 'manual' && (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <input
        type="text"
        placeholder="Enter Card ID"
        value={manualCardId}
        onChange={(e) => setManualCardId(e.target.value)}
        className="flex-grow w-full sm:w-auto bg-transparent border border-white/40 text-white placeholder-white/70 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
      />
      <button
        onClick={handleManualCheck}
        className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-4 py-2 rounded transition min-w-[80px]"
      >
        Check
      </button>
    </div>
  )}
</div>   
          <div className="grid grid-cols-2 gap-4 mt-6">

            <button

              onClick={togglePlayPause}

              className={`flex items-center bg-blue-500 justify-center px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${

                isRunning

                  ? 'bg-red-600 text-white'

                  : 'bg-blue-600 text-white'

              }`}

            >

              {isRunning ? (

                <Pause size={20} className="mr-2" />

              ) : (

                <Play size={20} className="mr-2" />

              )}

              {isRunning ? 'Pause' : 'Start/Resume'}

            </button>

            <button

              onClick={restartGame}

              className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"

            >

              <RotateCcw size={20} className="mr-2" />

              Restart

            </button>

            <button

              onClick={requestFullScreen}

              className="col-span-2 flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"

            >

              <Maximize2 size={20} className="mr-2" />

              Fullscreen

            </button>

          </div>

        </div>


          
        {/* Main Grid for Bingo Numbers - 5 Rows, 16 Columns */}
        <div className="flex-1 p-6 rounded-2xl bg-white/5 backdrop-blur-md shadow-xl border border-white/10 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-16 gap-x-2 gap-y-2 text-center font-bold text-white text-base">
            {Object.entries(CATEGORIES).map(([letter, [min, max]]) => (
              <React.Fragment key={letter}>
                <div
                  className={`flex items-center justify-center font-extrabold rounded-lg shadow-lg uppercase text-2xl p-3 border-4 border-white/80 ${categoryColors[letter]}`}
                  style={{ height: '50px', boxShadow: '0 4px 16px 0 rgba(255,255,255,0.10)' }}
                >
                  {letter}
                </div>
                {Array.from({ length: 15 }).map((_, colIndex) => {
                  const num = min + colIndex;
                  const isCurrent = num === currentCall;
                  const isCalled = calledNumbers.includes(num);

                  return (
                    <div
                      key={num}
                      className={`py-2 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 hover:ring-4 hover:ring-yellow-300/40 hover:z-10
                        ${isCurrent
                          ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-400 text-yellow-900 font-extrabold transform scale-110 ring-4 ring-yellow-300 animate-pulse-once shadow-yellow-300/60 shadow-2xl drop-shadow-lg'
                          : isCalled
                            ? 'bg-yellow-100/80 text-yellow-900 border-yellow-300 shadow-yellow-200/40 border font-bold'
                            : `${categoryColors[letter]} border drop-shadow-md`
                        }`}
                      style={{ height: '50px' }}
                    >
                      {num.toString().padStart(2, '0')}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Winning Cards Modal */}
      <WinningCardsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        winningCardIds={winningCards}
        allBingoCards={bingoCardsData}
        calledNumbersSet={new Set(calledNumbers)}
        status={status}
      />
    </div>
  );
}
