/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from "react";
import ShuffleText from "./ShuffleText";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-3 z-50 text-neutral-300 text-sm border-t border-white/10">
      <div className="relative max-w-screen-xl mx-auto flex items-center justify-between gap-4 px-4 h-12 w-full">
        
        {/* Left side */}
        <p className="text-neutral-400 whitespace-nowrap">
          made with ❤️ by{" "}
          <a
            href="https://instagram.com/sum.rov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel text-lg text-amber-200 hover:text-white transition-colors relative no-underline after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-0 after:bg-amber-300 after:transition-all after:duration-300 hover:after:w-full"
          >
            arXiVius
          </a>
        </p>

        {/* Center section — now non-blocking */}
        <div className="absolute inset-x-0 flex flex-col items-center hidden md:flex text-center pointer-events-none">
          {/* Main shuffle tagline */}
          <div className="pointer-events-auto">
            <ShuffleText>
              {"if (time) { reimagine(); rewrite(); } return Re:You;"}
            </ShuffleText>
          </div>

          {/* Subtle secondary shuffle line */}
          <div className="text-[10px] text-neutral-500/20 mt-0.5 select-none hover:text-neutral-400/40 transition-colors duration-300 pointer-events-auto">
            <ShuffleText>
              {"powered by Google’s Nano Banana model"}
            </ShuffleText>
          </div>
        </div>

        {/* Right side */}
        <a
          href="https://github.com/arxivius/Re-You"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans tracking-wide text-center text-white bg-transparent border border-white/50 py-2 px-4 rounded-md transition-colors duration-200 hover:bg-white hover:text-black whitespace-nowrap"
        >
          See the GitHub
        </a>
      </div>
    </footer>
  );
};

export default Footer;
