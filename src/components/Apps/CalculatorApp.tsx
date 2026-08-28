import React, { useState, useEffect } from 'react';
import styles from './CalculatorApp.module.css';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNum = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOp = (op: string) => {
    const lastChar = history.trim().slice(-1);
    if (waitingForOperand && ['+', '-', '*', '/'].includes(lastChar)) {
      setHistory(history.slice(0, -2) + ' ' + op + ' ');
      return;
    }
    
    setHistory(history + display + ' ' + op + ' ');
    setWaitingForOperand(true);
  };

  const handleEqual = () => {
    if (!history) return;
    try {
      const expr = history + display;
      // Using eval safely for basic math
      const sanitizedExpr = expr.replace(/[^-()\d/*+.]/g, '');
      const result = new Function(`return ${sanitizedExpr}`)();
      
      setDisplay(String(result));
      setHistory('');
      setWaitingForOperand(true);
    } catch {
      setDisplay('Error');
      setHistory('');
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setHistory('');
    setWaitingForOperand(false);
  };

  const handleDelete = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const handleDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
    setWaitingForOperand(true);
  };

  const handleToggleSign = () => {
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  };

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const key = e.key;
      if (/[0-9]/.test(key)) handleNum(key);
      else if (key === '+') handleOp('+');
      else if (key === '-') handleOp('-');
      else if (key === '*') handleOp('*');
      else if (key === '/') handleOp('/');
      else if (key === 'Enter' || key === '=') handleEqual();
      else if (key === 'Escape') handleClear();
      else if (key === 'Backspace') handleDelete();
      else if (key === '.') handleDot();
      else if (key === '%') handlePercent();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, history, waitingForOperand]); // Added dependencies to capture current state

  return (
    <div className={styles.calculator}>
      <div className={styles.display}>
        <div className={styles.history}>{history.replace(/\*/g, '×').replace(/\//g, '÷')}</div>
        <div className={styles.current}>{display}</div>
      </div>
      
      <div className={styles.grid}>
        <button className={`${styles.button} ${styles.clear}`} onClick={handleClear}>C</button>
        <button className={`${styles.button} ${styles.operator}`} onClick={handleToggleSign}>±</button>
        <button className={`${styles.button} ${styles.operator}`} onClick={handlePercent}>%</button>
        <button className={`${styles.button} ${styles.operator}`} onClick={() => handleOp('/')}>÷</button>
        
        <button className={styles.button} onClick={() => handleNum('7')}>7</button>
        <button className={styles.button} onClick={() => handleNum('8')}>8</button>
        <button className={styles.button} onClick={() => handleNum('9')}>9</button>
        <button className={`${styles.button} ${styles.operator}`} onClick={() => handleOp('*')}>×</button>
        
        <button className={styles.button} onClick={() => handleNum('4')}>4</button>
        <button className={styles.button} onClick={() => handleNum('5')}>5</button>
        <button className={styles.button} onClick={() => handleNum('6')}>6</button>
        <button className={`${styles.button} ${styles.operator}`} onClick={() => handleOp('-')}>−</button>
        
        <button className={styles.button} onClick={() => handleNum('1')}>1</button>
        <button className={styles.button} onClick={() => handleNum('2')}>2</button>
        <button className={styles.button} onClick={() => handleNum('3')}>3</button>
        <button className={`${styles.button} ${styles.operator}`} onClick={() => handleOp('+')}>+</button>
        
        <button className={`${styles.button} ${styles.zero}`} onClick={() => handleNum('0')}>0</button>
        <button className={styles.button} onClick={handleDot}>.</button>
        <button className={`${styles.button} ${styles.equals}`} onClick={handleEqual}>=</button>
      </div>
    </div>
  );
};
