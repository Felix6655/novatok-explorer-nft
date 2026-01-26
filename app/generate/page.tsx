"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [imageCount, setImageCount] = useState("1");
  const [model, setModel] = useState("stable-diffusion");
  const [style, setStyle] = useState("realistic");
  const [size, setSize] = useState("1024x1024");
  const [ratio, setRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSurpriseMe = () => {
    const surprisePrompts = [
      "A majestic dragon flying over a futuristic city at sunset",
      "An abstract representation of digital consciousness",
      "A serene forest with glowing mushrooms and fireflies",
      "A steampunk airship floating among the clouds",
      "A cyberpunk street scene with neon lights and rain",
    ];
    const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(randomPrompt);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      return;
    }
    
    setIsGenerating(true);
    setShowToast(true);
    
    // Simulate generation attempt
    setTimeout(() => {
      setIsGenerating(false);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-zinc-50">
          Create Hub
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Generate unique AI art for your NFTs
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 space-y-6">
          {/* Prompt textarea */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create... (e.g., 'A futuristic cityscape at night with neon lights')"
              className="w-full h-32 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Surprise me button */}
          <div>
            <button
              onClick={handleSurpriseMe}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md transition-colors"
            >
              Surprise me
            </button>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image count */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Image Count
              </label>
              <select
                value={imageCount}
                onChange={(e) => setImageCount(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="stable-diffusion">Stable Diffusion</option>
                <option value="dall-e">DALL-E</option>
                <option value="midjourney">Midjourney</option>
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="realistic">Realistic</option>
                <option value="artistic">Artistic</option>
                <option value="abstract">Abstract</option>
                <option value="cartoon">Cartoon</option>
                <option value="3d-render">3D Render</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="512x512">512x512</option>
                <option value="1024x1024">1024x1024</option>
                <option value="1024x1792">1024x1792</option>
                <option value="1792x1024">1792x1024</option>
              </select>
            </div>

            {/* Ratio */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Ratio
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
              </select>
            </div>
          </div>

          {/* Generate button */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition-colors"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Generated images area */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-black dark:text-zinc-50">
            Generated Images
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>Your generated images will appear here</p>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg shadow-lg">
          AI Service Not Configured
        </div>
      )}
    </div>
  );
}
