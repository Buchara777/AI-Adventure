
import React, { useState, useEffect } from 'react';

interface StoryDisplayProps {
  text: string;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    let i = 0;
    setDisplayedText(''); // Reset before starting the new animation

    const intervalId = setInterval(() => {
      i += 1;
      setDisplayedText(text.substring(0, i));
      
      if (i >= text.length) {
        clearInterval(intervalId);
      }
    }, 20);

    // Cleanup interval on component unmount or when text changes
    return () => clearInterval(intervalId);
  }, [text]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700 min-h-[200px]">
      <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
        {displayedText}
      </p>
    </div>
  );
};

export default StoryDisplay;
