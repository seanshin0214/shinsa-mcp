// 에세이 → 신학과사회 논문 변환기

import {
  JournalTemplate,
  FormattedPaper,
  FormattedSection,
  SHINSA_TEMPLATE,
  toRoman,
  generateHeader
} from './template.js';
import { parseCitation, extractCitations } from '../parsers/index.js';
import { toFootnote, toBibliography, sortBibliography } from '../converters/index.js';

export interface EssayInput {
  title: string;
  subtitle?: string;
  author: string;
  affiliation: string;
  field?: string;      // 전공 분야 (예: 신학, 기독교역사)
  email?: string;
  funding?: string;    // 연구비 지원 정보

  abstract_kr?: string;
  keywords_kr?: string[];

  body: string;  // 마크다운 또는 일반 텍스트

  references?: string[];  // 원시 참고문헌 목록

  abstract_en?: string;
  keywords_en?: string[];
}

export interface ConversionOptions {
  template?: JournalTemplate;
  volume?: number;
  issue?: number;
  year?: number;
  start_page?: number;
  auto_extract_citations?: boolean;
  convert_citations?: boolean;
}

// 본문에서 섹션 구조 추출
function extractSections(body: string): FormattedSection[] {
  const sections: FormattedSection[] = [];
  const lines = body.split('\n');

  let currentChapter = 0;
  let currentSection = 0;
  let currentSubsection = 0;
  let currentContent: string[] = [];
  let currentTitle = '';
  let currentLevel: 1 | 2 | 3 = 1;

  const flushSection = () => {
    if (currentTitle || currentContent.length > 0) {
      let number = '';
      if (currentLevel === 1 && currentChapter > 0) {
        number = `${toRoman(currentChapter)}.`;
      } else if (currentLevel === 2 && currentSection > 0) {
        number = `${currentSection}.`;
      } else if (currentLevel === 3 && currentSubsection > 0) {
        number = `${currentSubsection})`;
      }

      sections.push({
        level: currentLevel,
        number,
        title: currentTitle,
        content: currentContent.join('\n').trim(),
        footnote_refs: []
      });
    }
    currentContent = [];
    currentTitle = '';
  };

  for (const line of lines) {
    // # 또는 ## 스타일 제목 감지
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    // 로마 숫자 제목 감지 (I. 서론, II. 본론)
    const romanMatch = line.match(/^(I{1,3}|IV|V|VI{0,3})\.\s+(.+)$/);

    // 아라비아 숫자 제목 감지 (1. 첫 번째 절)
    const arabicMatch = line.match(/^(\d+)\.\s+(.+)$/);

    // 괄호 숫자 제목 감지 (1) 소제목)
    const parenMatch = line.match(/^(\d+)\)\s+(.+)$/);

    if (h1Match || romanMatch) {
      flushSection();
      currentChapter++;
      currentSection = 0;
      currentSubsection = 0;
      currentLevel = 1;
      currentTitle = h1Match ? h1Match[1] : romanMatch![2];
    } else if (h2Match || (arabicMatch && !line.startsWith('1)'))) {
      flushSection();
      currentSection++;
      currentSubsection = 0;
      currentLevel = 2;
      currentTitle = h2Match ? h2Match[1] : arabicMatch![2];
    } else if (h3Match || parenMatch) {
      flushSection();
      currentSubsection++;
      currentLevel = 3;
      currentTitle = h3Match ? h3Match[1] : parenMatch![2];
    } else {
      currentContent.push(line);
    }
  }

  flushSection();
  return sections;
}

// 인라인 인용을 각주로 변환
function convertInlineCitationsToFootnotes(
  text: string,
  startNum: number = 1
): { text: string; footnotes: { number: number; content: string }[] } {
  const footnotes: { number: number; content: string }[] = [];
  let footnoteNum = startNum;

  // (저자, 연도) 또는 (저자 연도: 페이지) 패턴 찾기
  const citationPattern = /\(([^)]+,\s*\d{4}[^)]*)\)/g;

  const newText = text.replace(citationPattern, (match, citation) => {
    footnotes.push({
      number: footnoteNum,
      content: `${footnoteNum}) ${citation.trim()}.`
    });
    const superscript = `${footnoteNum})`;
    footnoteNum++;
    return superscript;
  });

  return { text: newText, footnotes };
}

// 참고문헌 변환 및 정렬
function formatReferences(refs: string[]): string[] {
  const formatted = refs.map(ref => {
    const parsed = parseCitation(ref);
    const bib = toBibliography(parsed);
    return bib || ref;
  }).filter(r => r.trim());

  return sortBibliography(formatted);
}

// 메인 변환 함수
export function convertEssayToPaper(
  input: EssayInput,
  options: ConversionOptions = {}
): FormattedPaper {
  const template = options.template || SHINSA_TEMPLATE;
  const volume = options.volume || template.volume;
  const issue = options.issue || template.issue;
  const year = options.year || template.year;
  const startPage = options.start_page || 1;

  // 본문에서 섹션 추출
  const sections = extractSections(input.body);

  // 각주 처리
  const allFootnotes: { number: number; content: string }[] = [];
  let footnoteCounter = 1;

  // 각 섹션의 인라인 인용을 각주로 변환
  if (options.auto_extract_citations !== false) {
    for (const section of sections) {
      const result = convertInlineCitationsToFootnotes(
        section.content,
        footnoteCounter
      );
      section.content = result.text;
      section.footnote_refs = result.footnotes.map(f => f.number);
      allFootnotes.push(...result.footnotes);
      footnoteCounter = allFootnotes.length + 1;
    }
  }

  // 참고문헌 변환
  let references: string[] = [];
  if (input.references) {
    references = options.convert_citations !== false
      ? formatReferences(input.references)
      : input.references;
  }

  // 페이지 헤더 생성 (대략적인 페이지 수 추정)
  const estimatedPages = Math.ceil(
    (input.body.length + (input.abstract_kr?.length || 0)) / 2000
  ) + 2;

  const headers: { page: number; content: string }[] = [];
  for (let p = startPage; p < startPage + estimatedPages; p++) {
    headers.push({
      page: p,
      content: generateHeader(
        { ...template, volume, issue, year },
        p,
        input.title
      )
    });
  }

  return {
    metadata: {
      title: input.title,
      subtitle: input.subtitle,
      author: input.author,
      affiliation: input.affiliation,
      field: input.field,
      email: input.email,
      funding: input.funding
    },
    abstract_kr: input.abstract_kr || '',
    keywords_kr: input.keywords_kr || [],
    body: sections,
    references,
    abstract_en: input.abstract_en || '',
    keywords_en: input.keywords_en || [],
    footnotes: allFootnotes,
    headers
  };
}

// 마크다운 출력 생성
export function toMarkdown(paper: FormattedPaper, template?: JournalTemplate): string {
  const t = template || SHINSA_TEMPLATE;

  let md = '';

  // 헤더 정보
  md += `<!-- 「${t.journal_name}」 ${t.volume}(${t.issue}) ${t.year} -->\n\n`;

  // 제목
  md += `# ${paper.metadata.title}\n`;
  if (paper.metadata.subtitle) {
    md += `### ${paper.metadata.subtitle}\n`;
  }
  md += '\n';

  // 저자
  md += `**${paper.metadata.author}**\n`;
  md += `${paper.metadata.affiliation}\n`;
  if (paper.metadata.email) {
    md += `${paper.metadata.email}\n`;
  }
  md += '\n---\n\n';

  // 국문 초록
  md += '## 국문 초록\n\n';
  md += paper.abstract_kr || '[초록 작성 필요]';
  md += '\n\n';
  md += `**주제어**: ${paper.keywords_kr.length > 0 ? paper.keywords_kr.join(', ') : '[주제어 5개]'}\n`;
  md += '\n---\n\n';

  // 본문
  for (const section of paper.body) {
    const prefix = section.number ? `${section.number} ` : '';

    switch (section.level) {
      case 1:
        md += `## ${prefix}${section.title}\n\n`;
        break;
      case 2:
        md += `### ${prefix}${section.title}\n\n`;
        break;
      case 3:
        md += `#### ${prefix}${section.title}\n\n`;
        break;
    }

    if (section.content) {
      md += `${section.content}\n\n`;
    }
  }

  md += '---\n\n';

  // 참고문헌
  md += '## 참고문헌\n\n';
  if (paper.references.length > 0) {
    paper.references.forEach(ref => {
      md += `${ref}\n\n`;
    });
  } else {
    md += '[참고문헌 추가 필요]\n';
  }
  md += '\n---\n\n';

  // 영문 초록
  md += '## Abstract\n\n';
  md += paper.abstract_en || '[English abstract required]';
  md += '\n\n';
  md += `**Keywords**: ${paper.keywords_en.length > 0 ? paper.keywords_en.join(', ') : '[5 keywords]'}\n`;

  // 각주 섹션 (페이지 하단에 표시될 각주)
  if (paper.footnotes.length > 0) {
    md += '\n---\n\n';
    md += '## 각주\n\n';
    paper.footnotes.forEach(fn => {
      md += `${fn.content}\n`;
    });
  }

  return md;
}

// MS Word 호환 HTML 생성 (복사-붙여넣기용)
export function toWordHTML(paper: FormattedPaper, template?: JournalTemplate): string {
  const t = template || SHINSA_TEMPLATE;

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: '바탕', 'Batang', serif; font-size: 10pt; line-height: 1.6; }
  h1 { font-family: '신명조', serif; font-size: 16pt; font-weight: bold; text-align: center; }
  h2 { font-family: '신명조', serif; font-size: 12pt; font-weight: bold; }
  h3 { font-size: 11pt; font-weight: bold; }
  h4 { font-size: 10pt; }
  .author { text-align: center; margin: 20px 0; }
  .abstract { margin: 20px 30px; font-size: 9pt; }
  .keywords { font-size: 9pt; }
  .footnote { font-size: 9pt; }
  .reference { margin-bottom: 10px; }
  .header { font-size: 9pt; color: #666; }
  sup { font-size: 8pt; }
</style>
</head>
<body>
`;

  // 헤더
  html += `<div class="header">「${t.journal_name}」 ${t.volume}(${t.issue}) ${t.year}</div>\n`;

  // 제목
  html += `<h1>${paper.metadata.title}</h1>\n`;
  if (paper.metadata.subtitle) {
    html += `<h2 style="text-align:center; font-weight:normal;">${paper.metadata.subtitle}</h2>\n`;
  }

  // 저자
  html += `<div class="author"><strong>${paper.metadata.author}</strong><br>${paper.metadata.affiliation}</div>\n`;

  // 국문 초록
  html += `<hr>\n<h2>국문 초록</h2>\n`;
  html += `<div class="abstract">${paper.abstract_kr || '[초록]'}</div>\n`;
  html += `<p class="keywords"><strong>주제어</strong>: ${paper.keywords_kr.join(', ') || '[주제어]'}</p>\n<hr>\n`;

  // 본문
  for (const section of paper.body) {
    const prefix = section.number ? `${section.number} ` : '';

    switch (section.level) {
      case 1:
        html += `<h2>${prefix}${section.title}</h2>\n`;
        break;
      case 2:
        html += `<h3>${prefix}${section.title}</h3>\n`;
        break;
      case 3:
        html += `<h4>${prefix}${section.title}</h4>\n`;
        break;
    }

    if (section.content) {
      const paragraphs = section.content.split('\n\n');
      paragraphs.forEach(p => {
        if (p.trim()) {
          html += `<p>${p.trim()}</p>\n`;
        }
      });
    }
  }

  // 참고문헌
  html += `<hr>\n<h2>참고문헌</h2>\n`;
  paper.references.forEach(ref => {
    html += `<p class="reference">${ref}</p>\n`;
  });

  // 영문 초록
  html += `<hr>\n<h2>Abstract</h2>\n`;
  html += `<div class="abstract">${paper.abstract_en || '[Abstract]'}</div>\n`;
  html += `<p class="keywords"><strong>Keywords</strong>: ${paper.keywords_en.join(', ') || '[Keywords]'}</p>\n`;

  html += `</body></html>`;

  return html;
}
