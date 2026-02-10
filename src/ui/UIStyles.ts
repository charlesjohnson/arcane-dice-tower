// src/ui/UIStyles.ts
export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .dice-selector {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(10, 10, 20, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(136, 85, 255, 0.3);
      z-index: 20;
    }

    .dice-btn {
      position: relative;
      width: 60px;
      height: 70px;
      background: none;
      border: 1px solid rgba(136, 85, 255, 0.2);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #e0d8c8;
      font-size: 12px;
      padding: 4px;
    }

    .dice-btn:hover {
      border-color: rgba(136, 85, 255, 0.6);
      background: rgba(136, 85, 255, 0.1);
    }

    .dice-btn canvas {
      width: 36px;
      height: 36px;
    }

    .dice-btn .count-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #8855ff, #aa77ff);
      color: white;
      font-size: 11px;
      font-weight: bold;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px rgba(136, 85, 255, 0.6);
    }

    .dice-btn .count-badge.hidden {
      display: none;
    }

    .roll-summary {
      position: fixed;
      bottom: 155px;
      left: 50%;
      transform: translateX(-50%);
      color: #bb99ff;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(136, 85, 255, 0.5);
      z-index: 20;
    }

    .roll-btn {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: 160px;
      height: 50px;
      background: linear-gradient(135deg, #2a1050, #4a2080);
      border: 2px solid rgba(136, 85, 255, 0.5);
      border-radius: 25px;
      color: #e0d8c8;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 3px;
      box-shadow: 0 0 20px rgba(136, 85, 255, 0.3);
      transition: all 0.3s;
      z-index: 20;
    }

    .roll-btn:hover:not(:disabled) {
      box-shadow: 0 0 40px rgba(136, 85, 255, 0.6);
      transform: translateX(-50%) scale(1.05);
    }

    .roll-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .results-bar {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px 24px;
      background: rgba(10, 10, 20, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(136, 85, 255, 0.3);
      z-index: 20;
      opacity: 0;
      transition: opacity 0.5s;
    }

    .results-bar.visible {
      opacity: 1;
    }

    .result-value {
      font-size: 22px;
      font-weight: bold;
      color: #bb99ff;
      text-shadow: 0 0 10px rgba(136, 85, 255, 0.5);
    }

    .result-label {
      font-size: 11px;
      color: #8877aa;
    }

    .result-total {
      font-size: 28px;
      font-weight: bold;
      color: #ffdd66;
      text-shadow: 0 0 15px rgba(255, 200, 50, 0.5);
      margin-left: 8px;
      padding-left: 16px;
      border-left: 1px solid rgba(136, 85, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
}
