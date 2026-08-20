import React, { useState } from 'react';
import styles from './BrowserApp.module.css';

interface Tab {
  id: string;
  title: string;
  url: string;
}

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', title: 'Welcome', url: '' }]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [urlInput, setUrlInput] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleAddTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, title: 'New Tab', url: '' }]);
    setActiveTabId(newId);
    setUrlInput('');
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[newTabs.length - 1];
      setActiveTabId(newActive.id);
      setUrlInput(newActive.url);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    let finalUrl = urlInput;
    if (!/^https?:\/\//i.test(finalUrl) && finalUrl !== '') {
      finalUrl = 'https://' + finalUrl;
    }
    
    setTabs(tabs.map(t => 
      t.id === activeTabId ? { ...t, url: finalUrl, title: finalUrl } : t
    ));
    setUrlInput(finalUrl);
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTabId(tab.id);
    setUrlInput(tab.url);
  };

  return (
    <div className={styles.browser}>
      <div className={styles.header}>
        <div className={styles.tabBar}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`${styles.tab} ${tab.id === activeTabId ? styles.tabActive : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              <span className={styles.tabTitle}>{tab.title}</span>
              <button className={styles.closeTab} onClick={(e) => handleCloseTab(e, tab.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
          <button className={styles.iconButton} onClick={handleAddTab}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <div className={styles.toolbar}>
          <button className={styles.iconButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button className={styles.iconButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button className={styles.iconButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
          <button className={styles.iconButton} onClick={() => {
            setUrlInput('');
            setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: '', title: 'Welcome' } : t));
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
          
          <form className={styles.addressBar} onSubmit={handleNavigate}>
            <input 
              type="text" 
              className={styles.addressInput}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter web address"
            />
          </form>
        </div>
      </div>
      
      <div className={styles.content}>
        {activeTab?.url ? (
          <iframe 
            src={activeTab.url} 
            className={styles.iframe} 
            title={activeTab.title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        ) : (
          <div className={styles.welcome}>
            <h1>Welcome to ARGUS Browser</h1>
            <p>Fast, secure, and privacy-focused browsing experience.</p>
            
            <div className={styles.links}>
              <div className={styles.linkCard} onClick={() => { setUrlInput('https://example.com'); handleNavigate({ preventDefault: () => {} } as any); }}>
                <h3>Example.com</h3>
                <p>Visit example domain</p>
              </div>
              <div className={styles.linkCard} onClick={() => { setUrlInput('https://en.wikipedia.org'); handleNavigate({ preventDefault: () => {} } as any); }}>
                <h3>Wikipedia</h3>
                <p>The free encyclopedia</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
