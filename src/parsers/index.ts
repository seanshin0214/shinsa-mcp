import { PATTERNS } from './patterns.js';
import type { CitationType, CitationFields, ParsedCitation } from '../types/citation.js';

// 인용 텍스트 파싱
export function parseCitation(text: string, id: number = 0): ParsedCitation {
  const trimmed = text.trim();

  // 1. 번역서 (슬래시 감지 - 최우선)
  if (trimmed.includes('/') && trimmed.includes('옮김')) {
    const match = PATTERNS.TRANSLATION.exec(trimmed);
    if (match) {
      return {
        id,
        original: trimmed,
        type: 'korean_translation',
        confidence: 0.95,
        fields: {
          originalAuthor: match[1].trim(),
          translator: match[2].trim(),
          title: match[3].trim(),
          city: match[4].trim(),
          publisher: match[5].trim(),
          year: match[6],
          page: match[7] || undefined
        }
      };
    }
  }

  // 2. Ibid
  const ibidMatch = PATTERNS.IBID.exec(trimmed);
  if (ibidMatch) {
    return {
      id,
      original: trimmed,
      type: 'ibid',
      confidence: 1.0,
      fields: {
        isIbid: true,
        page: ibidMatch[1] || undefined
      }
    };
  }

  // 3. 성경
  const bibleMatch = PATTERNS.BIBLE.exec(trimmed);
  if (bibleMatch) {
    return {
      id,
      original: trimmed,
      type: 'bible',
      confidence: 0.98,
      fields: {
        book: bibleMatch[1],
        chapter: bibleMatch[2],
        verse: bibleMatch[3],
        version: bibleMatch[4] || undefined
      }
    };
  }

  // 4. 국문 학술논문 (「 」 감지)
  if (trimmed.includes('「')) {
    const match = PATTERNS.KOREAN_ARTICLE.exec(trimmed);
    if (match) {
      return {
        id,
        original: trimmed,
        type: 'korean_article',
        confidence: 0.92,
        fields: {
          author: match[1].trim(),
          title: match[2].trim(),
          journal: match[3].trim(),
          volume: match[4],
          issue: match[5] || undefined,
          year: match[6],
          page: match[7] || undefined
        }
      };
    }
  }

  // 5. 국문 단행본 (『 』 감지)
  if (trimmed.includes('『')) {
    const chapterMatch = PATTERNS.KOREAN_CHAPTER.exec(trimmed);
    if (chapterMatch) {
      return {
        id,
        original: trimmed,
        type: 'korean_chapter',
        confidence: 0.90,
        fields: {
          author: chapterMatch[1].trim(),
          title: chapterMatch[2].trim(),
          editor: chapterMatch[3].trim(),
          bookTitle: chapterMatch[4].trim(),
          city: chapterMatch[5].trim(),
          publisher: chapterMatch[6].trim(),
          year: chapterMatch[7],
          page: chapterMatch[8] || undefined
        }
      };
    }

    const bookMatch = PATTERNS.KOREAN_BOOK.exec(trimmed);
    if (bookMatch) {
      return {
        id,
        original: trimmed,
        type: 'korean_book',
        confidence: 0.92,
        fields: {
          author: bookMatch[1].trim(),
          title: bookMatch[2].trim(),
          city: bookMatch[3].trim(),
          publisher: bookMatch[4].trim(),
          year: bookMatch[5],
          page: bookMatch[6] || undefined
        }
      };
    }

    const shortRefKr = PATTERNS.SHORT_REF_BOOK_KR.exec(trimmed);
    if (shortRefKr) {
      return {
        id,
        original: trimmed,
        type: 'short_ref',
        confidence: 0.85,
        fields: {
          author: shortRefKr[1].trim(),
          title: shortRefKr[2].trim(),
          page: shortRefKr[3]
        }
      };
    }
  }

  // 6. 외국어 논문 (* * 감지 + " ")
  if (trimmed.includes('*') && (trimmed.includes('"') || trimmed.includes('"'))) {
    const match = PATTERNS.FOREIGN_ARTICLE.exec(trimmed);
    if (match) {
      return {
        id,
        original: trimmed,
        type: 'foreign_article',
        confidence: 0.90,
        fields: {
          author: match[1].trim(),
          title: match[2].trim(),
          journal: match[3].trim(),
          volume: match[4],
          issue: match[5] || undefined,
          year: match[6],
          page: match[7] || undefined
        }
      };
    }
  }

  // 7. 외국어 단행본 (* * 감지)
  if (trimmed.includes('*')) {
    const bookMatch = PATTERNS.FOREIGN_BOOK.exec(trimmed);
    if (bookMatch) {
      return {
        id,
        original: trimmed,
        type: 'foreign_book',
        confidence: 0.90,
        fields: {
          author: bookMatch[1].trim(),
          title: bookMatch[2].trim(),
          city: bookMatch[3].trim(),
          publisher: bookMatch[4].trim(),
          year: bookMatch[5],
          page: bookMatch[6] || undefined
        }
      };
    }

    const shortRefEn = PATTERNS.SHORT_REF_BOOK_EN.exec(trimmed);
    if (shortRefEn) {
      return {
        id,
        original: trimmed,
        type: 'short_ref',
        confidence: 0.85,
        fields: {
          author: shortRefEn[1].trim(),
          title: shortRefEn[2].trim(),
          page: shortRefEn[3]
        }
      };
    }
  }

  // 8. 학위논문 (국문)
  if (trimmed.includes('학위논문')) {
    const match = PATTERNS.THESIS_KR.exec(trimmed);
    if (match) {
      return {
        id,
        original: trimmed,
        type: 'thesis',
        confidence: 0.92,
        fields: {
          author: match[1].trim(),
          title: match[2].trim(),
          degree: match[3] === '박사' ? 'doctoral' : 'master',
          university: match[4].trim(),
          year: match[5],
          page: match[6] || undefined
        }
      };
    }
  }

  // 9. 학위논문 (영문)
  if (/dissertation|thesis/i.test(trimmed)) {
    const match = PATTERNS.THESIS_EN.exec(trimmed);
    if (match) {
      return {
        id,
        original: trimmed,
        type: 'thesis',
        confidence: 0.88,
        fields: {
          author: match[1].trim(),
          title: match[2].trim(),
          degree: /Ph\.?D|doctoral/i.test(match[3]) ? 'doctoral' : 'master',
          university: match[4].trim(),
          year: match[5],
          page: match[6] || undefined
        }
      };
    }
  }

  // 10. 인터넷 자료
  if (trimmed.includes('[온라인자료]')) {
    const match = PATTERNS.WEB.exec(trimmed);
    if (match) {
      return {
        id,
        original: trimmed,
        type: 'web',
        confidence: 0.90,
        fields: {
          author: match[1]?.trim() || undefined,
          title: match[2].trim(),
          url: match[3],
          accessDate: `${match[4]}.${match[5].padStart(2, '0')}.${match[6].padStart(2, '0')}`
        }
      };
    }
  }

  // 파싱 실패
  return {
    id,
    original: trimmed,
    type: 'unknown',
    confidence: 0,
    fields: {},
    warnings: ['인용 형식을 인식할 수 없습니다.']
  };
}

// 여러 인용 추출
export function extractCitations(text: string): ParsedCitation[] {
  const citations: ParsedCitation[] = [];
  const footnotePattern = /(\d+)\)\s*([^]+?)(?=\d+\)|$)/g;
  let match;
  let id = 1;

  while ((match = footnotePattern.exec(text)) !== null) {
    const citationText = match[2].trim();
    if (citationText) {
      citations.push(parseCitation(citationText, id++));
    }
  }

  if (citations.length === 0) {
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach((line, idx) => {
      citations.push(parseCitation(line, idx + 1));
    });
  }

  return citations;
}

export function detectCitationType(text: string): CitationType {
  const parsed = parseCitation(text);
  return parsed.type;
}
