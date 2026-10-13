import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronRight, Download, FileText, Minus, Moon, Plus, Search, Sun, Upload, X } from 'lucide-react';
import mammoth from 'mammoth/mammoth.browser';
import manuscriptData from './data/manuscript.json';
import frontCover from '@assets/480e2a40-61a7-4028-a9fa-aaaaa873c5a7_89ACE6E2-F84B-4BC4-871F-_1791887119338.jpeg';
import backCover from '@assets/1fb14303-d288-4e7d-bba8-24de20be5a5e_18494AC1-A08F-455B-BAA4-_1791887119338.jpeg';

type Book = { title: string; subtitle: string; author: string; paragraphs: string[]; appreciation?: string[] };

const START_BOOK: Book = manuscriptData as Book;
const APPRECIATION_PARAGRAPHS = START_BOOK.appreciation ?? [
  'All praise and gratitude belong to Allah, whose mercy, guidance, and favour have brought me this far. Alhamdulillah for every lesson, every answered prayer, and every moment that eventually made sense.',
  'To my mum and dad, thank you for your sacrifices, prayers, love, and unwavering support. To my family, lecturers, mentors, friends, and everyone who contributed to my journey in one way or another, I am deeply grateful.',
  'May Allah reward you all abundantly.',
  'Every journey has a story, and this is a little piece of mine. A story of hope, courage, struggles, and becoming.',
  'And Then, It All Made Sense',
  'By Roqeebah Olaide Onigbanjo',
  'Love and light!',
];
const BACK_COVER_SEARCH = [
  'Roqeebah Olaide ONIGBANJO is a nursing graduate of Crescent University, Abeokuta, where she earned a Bachelor of Nursing Science (BNSc) degree with First Class Honours, alongside three professional qualifications: Registered Nurse (RN), Registered Midwife (RM), and Registered Public Health Nurse (RPHN).',
  'While still an undergraduate, she successfully published three research papers and developed a growing interest in public health, maternal and child health, nursing research, evidence-based practice, and pain and palliative care. She is passionate about advancing nursing practice, contributing to research, and improving health outcomes through evidence-informed and compassionate care.',
  'Her academic journey reflects resilience, perseverance, and a commitment to personal and professional growth. Through her story, she hopes to inspire students, particularly those who have faced academic challenges or uncertainty about their future, to remain hopeful and steadfast in pursuing their dreams, even when the journey becomes difficult.',
  'Connect with the Author. LinkedIn: Roqeebah ONIGBANJO, RN, RM, RPHN, BNSc (https://www.linkedin.com/public-profile/settings/). Email: roqeebahonigbanjo2001@gmail.com',
];
const TOC = [
  ['PROLOGUE', 'Before the Journey Began'],
  ['CHAPTER ONE', 'Maybe the Struggle Started Earlier'],
  ['CHAPTER TWO', 'When Life Didn’t Go as Planned'],
  ['CHAPTER THREE', 'The Third Attempt: Adams College'],
  ['CHAPTER FOUR', 'My COVID Season and My Second Return to Adams College'],
  ['CHAPTER FIVE', 'My Fifth UTME: Cairo University or Crescent University?'],
  ['CHAPTER SIX', 'Gaining Admission into Crescent University.'],
  ['CHAPTER SEVEN', 'Transitioning into the Nursing Department'],
  ['CHAPTER EIGHT', 'Year Three: The Beginning of My Professional Examinations'],
  ['CHAPTER NINE', 'My Second Professional Examinations and Year Four'],
  ['CHAPTER TEN', 'The Final Stretch'],
  ['EPILOGUE', 'And Then, It All Made Sense'],
  ['ACKNOWLEDGEMENTS', ''],
];
const HEADING_RE = /^(DEDICATION|TABLE OF CONTENTS|APPRECIATION|PROLOGUE|CHAPTER (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)|EPILOGUE|ACKNOWLEDGEMENTS)$/i;

function App() {
  const [book, setBook] = useState<Book>(START_BOOK);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('memoir-theme') === 'dark');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('memoir-size')) || 19);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [importError, setImportError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('memoir-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  useEffect(() => { localStorage.setItem('memoir-size', String(fontSize)); }, [fontSize]);
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, []);

  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (term.length < 2) return [];
    const appreciation = APPRECIATION_PARAGRAPHS.flatMap((text, index) => {
      const at = text.toLocaleLowerCase().indexOf(term);
      return at < 0 ? [] : [{ index: -(index + 2), text, at }];
    });
    const main = book.paragraphs.flatMap((text, index) => {
      const at = text.toLocaleLowerCase().indexOf(term);
      return at < 0 ? [] : [{ index, text, at }];
    });
    const backCover = BACK_COVER_SEARCH.flatMap((text) => {
      const at = text.toLocaleLowerCase().indexOf(term);
      return at < 0 ? [] : [{ index: -1, text, at }];
    });
    return [...appreciation, ...main, ...backCover].slice(0, 40);
  }, [book, query]);

  const locateParagraph = useCallback((index: number) => {
    setSearchOpen(false);
    window.setTimeout(() => {
      const targetId = index === -1
        ? 'back-cover-section'
        : index < -1
          ? `appreciation-copy-${-index - 2}`
          : `paragraph-${index}`;
      const node = document.getElementById(targetId);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        node.classList.add('search-flash');
        window.setTimeout(() => node.classList.remove('search-flash'), 1700);
      }
    }, 80);
  }, []);

  const jumpTo = (name: string) => {
    const index = book.paragraphs.map((text) => text.trim().toLocaleUpperCase()).lastIndexOf(name);
    if (index >= 0) locateParagraph(index);
  };

  const importDocx = async (file?: File) => {
    setImportError('');
    setImportNotice('');
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.docx')) {
      setImportError('Choose a .docx Word document. Other file types are not supported.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setImportError('This file is larger than 30 MB. Please choose a smaller Word document.');
      return;
    }
    setBusy(true);
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      const paragraphs = result.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!paragraphs.length) throw new Error('No readable paragraphs were found in this document.');
      const title = paragraphs.find((line) => /and then,? it all made sense/i.test(line)) || book.title;
      const subtitle = paragraphs.find((line) => /love letter to struggling students/i.test(line)) || book.subtitle;
      setBook({ ...book, title, subtitle, paragraphs });
      setQuery('');
      setImportNotice(`Imported ${paragraphs.length.toLocaleString()} paragraphs from ${file.name}. This preview is stored in this tab only.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The Word document could not be read. Try saving it as .docx and import again.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ ...book, appreciation: APPRECIATION_PARAGRAPHS }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'and-then-it-all-made-sense-reader.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const paragraphView = (text: string, index: number) => {
    const clean = text.trim();
    const titleLine = clean === 'AND THEN, IT ALL MADE SENSE';
    const heading = HEADING_RE.test(clean);
    const chapterMatch = clean.match(/^CHAPTER (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)$/i);
    return (
      <p id={`paragraph-${index}`} key={`p-${index}`} data-testid={`paragraph-${index}`} className={heading ? 'chapter-opening' : undefined}>
        {heading ? (
          <><span className="chapter-label">{clean}</span>{chapterMatch && book.paragraphs[index + 1] ? <span className="sr-only">{book.paragraphs[index + 1]}</span> : null}</>
        ) : titleLine ? <strong>{clean}</strong> : clean}
      </p>
    );
  };

  const storyParagraphIndexes = book.paragraphs.map((_, i) => i);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label="And Then, It All Made Sense, home" data-testid="link-home">
            <span className="brand-mark">R</span><span className="brand-title">And Then, It All Made Sense</span>
          </a>
          <nav className="nav-actions" aria-label="Reader tools">
            <button className="quiet-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search the memoir" data-testid="button-open-search"><Search size={17} /><span className="nav-text">Find in book</span></button>
            <button className="icon-button" onClick={() => setIsDark((dark) => !dark)} aria-label={isDark ? 'Switch to light reading mode' : 'Switch to dark reading mode'} data-testid="button-toggle-theme">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
          </nav>
        </div>
      </header>

      {searchOpen && <section className="search-drawer" role="dialog" aria-label="Search the memoir">
        <div className="search-inner">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Search size={19} aria-hidden="true" />
            <label className="sr-only" htmlFor="memoir-search">Search all book text</label>
            <input autoFocus id="memoir-search" className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search every page of the memoir…" data-testid="input-search" />
            <button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search" data-testid="button-close-search"><X size={19} /></button>
          </div>
          <div className="results" aria-live="polite" data-testid="search-results">
            {!query.trim() ? <div className="notice">Type at least two characters. Press <kbd>/</kbd> to search, or <kbd>Esc</kbd> to close.</div>
              : query.trim().length < 2 ? <div className="notice">Enter one more character to search.</div>
                : searchResults.length === 0 ? <div className="notice">No passages found for “{query}”. Try another word or phrase.</div>
                  : <><div className="notice">{searchResults.length === 40 ? '40+ passages' : `${searchResults.length} ${searchResults.length === 1 ? 'passage' : 'passages'}`} found</div>
                    {searchResults.map((result) => <button key={`${result.index}-${result.at}`} className="result-row" onClick={() => locateParagraph(result.index)} data-testid={`result-${result.index}-${result.at}`}>
                      <strong>{result.text.length > 65 ? `${result.text.slice(0, 65)}…` : result.text}</strong>
                      <p>{result.text.slice(Math.max(0, result.at - 52), Math.min(result.text.length, result.at + query.length + 88))}</p>
                    </button>)}</>}
          </div>
        </div>
      </section>}

      <main id="top">
        <section className="hero">
          <div>
            <div className="eyebrow">A true story of trying again</div>
            <h1 className="serif">And then,<br />it all <em>made sense.</em></h1>
            <p className="hero-copy">A love letter to struggling students. Roqeebah Olaide Onigbanjo tells the long, winding story of becoming a nurse—and of finding that a difficult road can still lead somewhere beautiful.</p>
            <p className="hero-byline">By Roqeebah Olaide Onigbanjo · RN, RM, RPHN, BNSc (First Class Hons)</p>
            <div className="hero-actions">
              <a className="primary-button" href="#reading"><BookOpen size={17} /> Begin reading <ArrowRight size={16} /></a>
              <a className="secondary-button" href="#contents">Explore the chapters <ArrowDown size={16} /></a>
            </div>
          </div>
          <div className="cover-stage">
            <img className="cover-image" src={frontCover} alt="Book cover: And Then It All Made Sense, A Love Letter to Struggling Students, by Onigbanjo Roqeebah" data-testid="img-front-cover" />
            <div className="cover-note">A story of staying the course</div>
          </div>
        </section>

        <section className="intro-strip" aria-label="A note from the author">
          <div className="intro-strip-inner"><p>“Nine years later, I graduated. And I did not just graduate.”</p><a className="secondary-button" href="#reading" style={{ color: 'inherit', borderColor: 'hsl(var(--primary-foreground) / .4)' }}>Read her story <ArrowRight size={16} /></a></div>
        </section>

        <section className="section" id="contents">
          <div className="eyebrow">The road, in her words</div>
          <h2 className="section-heading">One attempt at a time.</h2>
          <p className="section-lede">Five UTME attempts. A detour through uncertainty. Nine years of study, faith, and beginning again. Find your place in the story.</p>
          <div className="toc-layout">
            <aside className="toc-aside">
              <h3>Inside this book</h3>
              <p>From the first question mark to graduation day. Choose a chapter to go straight there, or let the story unfold from the beginning.</p>
              <button className="primary-button" onClick={() => jumpTo('PROLOGUE')} data-testid="button-start-prologue"><BookOpen size={17} /> Start with the prologue</button>
            </aside>
            <nav className="toc-list" aria-label="Table of contents">
              {TOC.map(([heading, title], i) => <button className="toc-item" key={heading} onClick={() => jumpTo(heading)} data-testid={`toc-${heading.toLowerCase().replaceAll(' ', '-')}`}>
                <span className="toc-num">{String(i + 1).padStart(2, '0')}</span><span className="toc-title">{title || heading}</span><ChevronRight size={17} />
              </button>)}
            </nav>
          </div>
        </section>

        <section className="appreciation" id="appreciation">
          <div className="appreciation-inner">
            <div className="eyebrow">Before the first page</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>A heartfelt appreciation</h2>
            <div className="appreciation-copy">
              {APPRECIATION_PARAGRAPHS.map((text, index) => (
                <p id={`appreciation-copy-${index}`} key={`appreciation-${index}`} data-testid={`appreciation-paragraph-${index}`}>{text}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="front-cover" style={{ textAlign: 'center', paddingBottom: '4rem' }}>
          <div className="eyebrow">The book</div>
          <h2 className="section-heading" style={{ fontSize: '2.4rem' }}>And Then, It All Made Sense</h2>
          <img src={frontCover} alt="Front cover of And Then It All Made Sense" style={{ width: 'min(310px, 74vw)', borderRadius: 6, boxShadow: '0 20px 45px hsl(350 27% 19% / .18)' }} data-testid="img-cover-title-page" />
        </section>

        <section className="reading-wrap" id="reading">
          <div className="reader-tools">
            <div className="reader-tools-inner">
              <div className="reader-tool-group"><BookOpen size={17} /><span className="tool-label">Reading view</span></div>
              <div className="reader-tool-group" aria-label="Reading text size">
                <span className="tool-label">Text</span>
                <button className="icon-button" onClick={() => setFontSize((n) => Math.max(15, n - 1))} aria-label="Decrease reading text size" disabled={fontSize <= 15} data-testid="button-decrease-text"><Minus size={16} /></button>
                <span className="tool-label" aria-live="polite" data-testid="text-size-value">{fontSize}px</span>
                <button className="icon-button" onClick={() => setFontSize((n) => Math.min(27, n + 1))} aria-label="Increase reading text size" disabled={fontSize >= 27} data-testid="button-increase-text"><Plus size={16} /></button>
                <button className="icon-button" onClick={() => setIsDark((dark) => !dark)} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} data-testid="button-reader-theme">{isDark ? <Sun size={17} /> : <Moon size={17} />}</button>
              </div>
            </div>
          </div>
          <div className="reader-content" style={{ ['--reader-size' as string]: `${fontSize}px` }}>
            <div className="eyebrow">The complete memoir</div>
            <article data-testid="reader-manuscript">
              {storyParagraphIndexes.map((i) => paragraphView(book.paragraphs[i], i))}
            </article>
            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '3rem', marginTop: '4rem' }}>
              <span className="eyebrow">The back cover</span>
              <h2 id="back-cover-section" className="serif" style={{ fontSize: '2rem', margin: '.7rem 0 1.5rem' }}>About the author</h2>
              <div className="author-section">
                <img className="back-image" src={backCover} alt="Back cover with Roqeebah Olaide Onigbanjo’s biography and portrait" data-testid="img-back-cover" />
                <div className="author-copy">
                  <p><strong>Roqeebah Olaide ONIGBANJO</strong> is a nursing graduate of Crescent University, Abeokuta, where she earned a Bachelor of Nursing Science (BNSc) degree with First Class Honours, alongside three professional qualifications: Registered Nurse (RN), Registered Midwife (RM), and Registered Public Health Nurse (RPHN).</p>
                  <p>While still an undergraduate, she successfully published three research papers and developed a growing interest in public health, maternal and child health, nursing research, evidence-based practice, and pain and palliative care. She is passionate about advancing nursing practice, contributing to research, and improving health outcomes through evidence-informed and compassionate care.</p>
                  <p>Her academic journey reflects resilience, perseverance, and a commitment to personal and professional growth. Through her story, she hopes to inspire students, particularly those who have faced academic challenges or uncertainty about their future, to remain hopeful and steadfast in pursuing their dreams, even when the journey becomes difficult.</p>
                  <div className="contact-list"><strong>Connect with the Author</strong><br />LinkedIn: Roqeebah ONIGBANJO, RN, RM, RPHN, BNSc (<a href="https://www.linkedin.com/public-profile/settings/" target="_blank" rel="noreferrer">https://www.linkedin.com/public-profile/settings/</a>)<br />Email: <a href="mailto:roqeebahonigbanjo2001@gmail.com">roqeebahonigbanjo2001@gmail.com</a></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="import">
          <div className="eyebrow">For the reader maintainer</div>
          <h2 className="section-heading">Replace the manuscript.</h2>
          <p className="section-lede">Load a Word document locally to preview its extracted text, then save a reader-ready JSON file. Your Word document stays on this device; nothing is uploaded.</p>
          <div className="import-panel">
            <div className="import-grid">
              <div>
                <h3>How to import a .docx</h3>
                <ol>
                  <li>Choose a Microsoft Word <strong>.docx</strong> manuscript below.</li>
                  <li>Give the local preview a moment to finish extracting paragraphs.</li>
                  <li>Search and read the preview; export its JSON if you want to keep the parsed copy.</li>
                </ol>
                <p>For the default book, the manuscript is bundled with this reader. Importing replaces the preview in this browser tab only; refresh to return to the bundled manuscript.</p>
              </div>
              <div className="file-picker">
                <label htmlFor="docx-upload"><strong>Choose a Word document</strong></label>
                <input ref={fileInput} id="docx-upload" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void importDocx(event.currentTarget.files?.[0])} data-testid="input-docx" />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                  <button className="primary-button" disabled={busy} onClick={() => fileInput.current?.click()} data-testid="button-import-docx">{busy ? <><FileText size={17} /> Reading document…</> : <><Upload size={17} /> Import .docx</>}</button>
                  <button className="secondary-button" onClick={downloadJson} data-testid="button-export-json"><Download size={17} /> Download JSON</button>
                </div>
                {importNotice && <div className="notice" role="status" data-testid="status-import"><Check size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />{importNotice}</div>}
                {importError && <div className="notice error" role="alert" data-testid="status-import-error">{importError}</div>}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">A quiet place for a story about finding your way. · {book.author}</footer>
    </div>
  );
}

export default App;
