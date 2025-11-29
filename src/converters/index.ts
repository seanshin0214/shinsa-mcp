import type { CitationType, CitationFields, ParsedCitation, ConversionResult } from '../types/citation.js';

// 저자명 변환: First Last → Last, First
export function convertToLastFirst(name: string): string {
  if (!name) return '';
  if (name.includes(',')) return name;

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;

  const last = parts.pop()!;
  return `${last}, ${parts.join(' ')}`;
}

// 각주 템플릿
const FOOTNOTE_TEMPLATES: Record<CitationType, (f: CitationFields) => string> = {
  korean_article: (f) =>
    `${f.author}, "${f.title}," 「${f.journal}」 ${f.volume}${f.issue ? '/' + f.issue : ''} (${f.year}), ${f.page || ''}.`.replace(/, \.$/, '.'),

  korean_book: (f) =>
    `${f.author}, 『${f.title}』 (${f.city}: ${f.publisher}, ${f.year}), ${f.page || ''}.`.replace(/, \.$/, '.'),

  korean_chapter: (f) =>
    `${f.author}, "${f.title}," ${f.editor} 편, 『${f.bookTitle}』 (${f.city}: ${f.publisher}, ${f.year}), ${f.page || ''}.`.replace(/, \.$/, '.'),

  korean_translation: (f) =>
    `${f.originalAuthor} / ${f.translator} 옮김, 『${f.title}』 (${f.city}: ${f.publisher}, ${f.year}), ${f.page || ''}.`.replace(/, \.$/, '.'),

  foreign_article: (f) =>
    `${f.author}, "${f.title}," *${f.journal}* ${f.volume}${f.issue ? '/' + f.issue : ''} (${f.year}), ${f.page || ''}.`.replace(/, \.$/, '.'),

  foreign_book: (f) =>
    `${f.author}, *${f.title}* (${f.city}: ${f.publisher}, ${f.year}), ${f.page || ''}.`.replace(/, \.$/, '.'),

  thesis: (f) => {
    const degreeKr = f.degree === 'doctoral' ? '박사' : '석사';
    const isKorean = /[가-힣]/.test(f.author || '');
    if (isKorean) {
      return `${f.author}, "${f.title}," ${degreeKr}학위논문, ${f.university}, ${f.year}, ${f.page || ''}.`.replace(/, \.$/, '.');
    }
    const degreeEn = f.degree === 'doctoral' ? 'Ph.D. dissertation' : 'M.A. thesis';
    return `${f.author}, "${f.title}," ${degreeEn}, ${f.university}, ${f.year}, ${f.page || ''}.`.replace(/, \.$/, '.');
  },

  web: (f) => {
    const author = f.author ? `${f.author}, ` : '';
    return `${author}"${f.title}," [온라인자료] ${f.url}, ${f.accessDate} 접속.`;
  },

  bible: (f) =>
    `(${f.book} ${f.chapter}:${f.verse}${f.version ? ', ' + f.version : ''})`,

  ibid: (f) =>
    f.page ? `Ibid., ${f.page}.` : 'Ibid.',

  short_ref: (f) => {
    const isBook = f.title && !f.title.includes('"');
    if (isBook) {
      const isKorean = /[가-힣]/.test(f.title || '');
      if (isKorean) {
        return `${f.author}, 『${f.title}』, ${f.page}.`;
      }
      return `${f.author}, *${f.title}*, ${f.page}.`;
    }
    return `${f.author}, "${f.title}," ${f.page}.`;
  },

  unknown: (f) => f.author || ''
};

// 참고문헌 템플릿
const BIBLIOGRAPHY_TEMPLATES: Record<CitationType, (f: CitationFields) => string> = {
  korean_article: (f) =>
    `${f.author}. "${f.title}." 「${f.journal}」 ${f.volume}${f.issue ? '/' + f.issue : ''}. ${f.year}. ${f.page || ''}.`.replace(/\. \.$/, '.'),

  korean_book: (f) =>
    `${f.author}. 『${f.title}』. ${f.city}: ${f.publisher}. ${f.year}.`,

  korean_chapter: (f) =>
    `${f.author}. "${f.title}." ${f.editor} 편. 『${f.bookTitle}』. ${f.city}: ${f.publisher}. ${f.year}. ${f.page || ''}.`.replace(/\. \.$/, '.'),

  korean_translation: (f) =>
    `${f.originalAuthor} / ${f.translator} 옮김. 『${f.title}』. ${f.city}: ${f.publisher}. ${f.year}.`,

  foreign_article: (f) => {
    const authorLastFirst = convertToLastFirst(f.author || '');
    return `${authorLastFirst}. "${f.title}." *${f.journal}* ${f.volume}${f.issue ? '/' + f.issue : ''}. ${f.year}. ${f.page || ''}.`.replace(/\. \.$/, '.');
  },

  foreign_book: (f) => {
    const authorLastFirst = convertToLastFirst(f.author || '');
    return `${authorLastFirst}. *${f.title}*. ${f.city}: ${f.publisher}. ${f.year}.`;
  },

  thesis: (f) => {
    const isKorean = /[가-힣]/.test(f.author || '');
    if (isKorean) {
      const degreeKr = f.degree === 'doctoral' ? '박사' : '석사';
      return `${f.author}. "${f.title}." ${degreeKr}학위논문. ${f.university}. ${f.year}.`;
    }
    const authorLastFirst = convertToLastFirst(f.author || '');
    const degreeEn = f.degree === 'doctoral' ? 'Ph.D. dissertation' : 'M.A. thesis';
    return `${authorLastFirst}. "${f.title}." ${degreeEn}. ${f.university}. ${f.year}.`;
  },

  web: (f) => {
    const author = f.author ? `${f.author}. ` : '';
    return `${author}"${f.title}." [온라인자료] ${f.url}. ${f.accessDate} 접속.`;
  },

  bible: () => '',
  ibid: () => '',
  short_ref: () => '',
  unknown: () => ''
};

export function toFootnote(citation: ParsedCitation): string {
  const template = FOOTNOTE_TEMPLATES[citation.type];
  if (!template) return citation.original;
  return template(citation.fields);
}

export function toBibliography(citation: ParsedCitation): string {
  const template = BIBLIOGRAPHY_TEMPLATES[citation.type];
  if (!template) return '';
  return template(citation.fields);
}

export function convertCitation(citation: ParsedCitation): ConversionResult {
  const warnings: string[] = [];

  if (citation.type === 'unknown') {
    warnings.push('인용 형식을 인식할 수 없어 변환하지 못했습니다.');
  }

  if (citation.confidence < 0.8) {
    warnings.push(`변환 신뢰도가 낮습니다 (${Math.round(citation.confidence * 100)}%)`);
  }

  return {
    footnote: toFootnote(citation),
    bibliography: toBibliography(citation),
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export function sortBibliography(items: string[]): string[] {
  const korean: string[] = [];
  const foreign: string[] = [];

  items.forEach(item => {
    if (!item) return;
    if (/^[가-힣]/.test(item)) {
      korean.push(item);
    } else {
      foreign.push(item);
    }
  });

  korean.sort((a, b) => a.localeCompare(b, 'ko'));
  foreign.sort((a, b) => a.localeCompare(b, 'en'));

  return [...korean, ...foreign];
}
