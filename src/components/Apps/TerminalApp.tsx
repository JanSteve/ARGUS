import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styles from './TerminalApp.module.css';

interface HistoryEntry {
  id: string;
  type: 'input' | 'output';
  content: string;
  path?: string;
}

export const TerminalApp: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { id: 'start1', type: 'output', content: 'ARGUS Sovereign OS Terminal' },
    { id: 'start2', type: 'output', content: 'Type "help" for a list of available commands.' }
  ]);
  const [input, setInput] = useState('');
  const [path, setPath] = useState('~');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleCommand = (cmd: string) => {
    const args = cmd.trim().split(' ');
    const base = args[0].toLowerCase();
    
    let output = '';
    let newPath = path;

    switch (base) {
      case 'help':
        output = 'Available commands: ls, cd, pwd, clear, help, echo, cat, whoami, date, uname, neofetch';
        break;
      case 'pwd':
        output = newPath === '~' ? '/home/jan-steve-daniel' : `/home/jan-steve-daniel/${newPath.replace('~/', '')}`;
        break;
      case 'ls':
        output = 'Desktop  Documents  Downloads  Music  Pictures  .config';
        break;
      case 'cd':
        if (args[1]) {
          newPath = args[1] === '~' ? '~' : `~/${args[1]}`;
        } else {
          newPath = '~';
        }
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'echo':
        output = args.slice(1).join(' ');
        break;
      case 'cat':
        output = args[1] ? `(simulated contents of ${args[1]})` : 'cat: missing operand';
        break;
      case 'whoami':
        output = 'jan-steve-daniel';
        break;
      case 'date':
        output = new Date().toString();
        break;
      case 'uname':
        output = 'ARGUS Sovereign OS v2.0.0 (x86_64)';
        break;
      case 'neofetch':
        output = `
       .-------.       jan-steve-daniel@sovereign
      /   o   o \\      --------------------------
     |    >_<    |     OS: ARGUS Sovereign OS v2.0.0
      \\  ___    /      Host: ARGUS VM
       '-------'       Kernel: 6.8.0-generic
                       Uptime: 1 hour, 42 mins
                       Packages: 1337 (dpkg)
                       Shell: zsh 5.9
                       Terminal: argus-term
        `;
        break;
      case '':
        break;
      default:
        output = `command not found: ${base}`;
    }

    const newEntries: HistoryEntry[] = [
      { id: Date.now().toString() + '-in', type: 'input', content: cmd, path }
    ];
    
    if (output) {
      newEntries.push({ id: Date.now().toString() + '-out', type: 'output', content: output });
    }

    setHistory(prev => [...prev, ...newEntries]);
    setPath(newPath);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        setCommandHistory(prev => [...prev, input]);
      }
      handleCommand(input);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < commandHistory.length) {
          setHistoryIndex(nextIndex);
          setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
      <div className={styles.history}>
        {history.map((entry) => (
          <div key={entry.id} className={styles.line}>
            {entry.type === 'input' && (
              <div className={styles.promptLine}>
                <span className={styles.prompt}>argus@sovereign:{entry.path}$</span>
                <span>{entry.content}</span>
              </div>
            )}
            {entry.type === 'output' && (
              <span className={entry.content.includes('.---') ? styles.neofetch : ''}>
                {entry.content}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className={styles.promptLine}>
        <span className={styles.prompt}>argus@sovereign:{path}$</span>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
      <div ref={endRef} />
    </div>
  );
};
