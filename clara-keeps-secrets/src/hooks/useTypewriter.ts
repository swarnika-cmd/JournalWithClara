import { useState, useEffect } from "react";

/**
 * A custom hook that animates the rendering of a string word-by-word.
 * @param text The complete target string to animate.
 * @param speed Milliseconds between rendering each word. Default is 25ms.
 */
export function useTypewriter(text: string, speed: number = 25) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    setDisplayedText("");
    
    const words = text.split(" ");
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < words.length) {
        setDisplayedText((prev) => {
          return prev ? prev + " " + words[index] : words[index];
        });
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return displayedText;
}
