// 신학과사회 저널 정확한 형식 템플릿
// 공식 투고 규정 기반 (학회논문투고 규정.md)

export interface JournalTemplate {
  // 문서 정보
  journal_name: string;
  volume: number;
  issue: number;
  year: number;

  // 페이지 설정 (공식: A4 10~12페이지)
  page: {
    size: 'A4';
    margins: { top: number; bottom: number; left: number; right: number };
    recommended_pages: { min: number; max: number };
  };

  // 폰트 설정 (공식: 바탕체, 10pt, 줄간격 160%)
  fonts: {
    title: { family: string; size: number; bold: boolean };
    subtitle: { family: string; size: number; bold: boolean };
    author: { family: string; size: number };
    body: { family: string; size: number; line_spacing: number };  // 줄간격 추가
    footnote: { family: string; size: number };
    header: { family: string; size: number };
  };

  // 인용 표기 기호 (공식 규정 4장)
  citation_marks: {
    paper_title: { open: string; close: string };      // 논문 제목: " "
    journal: { open: string; close: string };          // 잡지/정기간행물: 「 」
    book_kr: { open: string; close: string };          // 국문 도서: 『 』
    book_foreign: 'italic';                            // 외국어 도서: 이탤릭
    ibid: string;                                      // 반복 인용: Ibid.
  };

  // 참고문헌 정렬 규칙 (공식 규정 5장 + Claude Desktop 생성 기준)
  bibliography: {
    order: ['korean', 'foreign'];                      // 국문 먼저, 외국어 뒤
    korean_sort: 'hangul';                             // 가나다순
    foreign_sort: 'alphabet';                          // 알파벳순
    same_author_mark: string;                          // 동일 저자: _______
    hanging_indent: number;                            // 둘째 줄 들여쓰기 (cm)
    // 섹션 헤더 (Claude Desktop 기준)
    section_headers: {
      korean: string;    // '<국문 자료>'
      foreign: string;   // '<외국어 자료>'
      none_text: string; // '(해당 없음)'
    };
  };

  // 주제어 개수 (공식 규정 6장)
  keywords: {
    min: number;
    max: number;
  };

  // 표/그림 형식 (실제 논문 기준)
  figures: {
    caption_position: 'below';           // 그림 캡션: 아래
    caption_format: '<그림 {n}> {title}'; // <그림 1> 제목
    source_format: '출처: {source}';      // 출처 표시
  };

  tables: {
    caption_position: 'above';           // 표 캡션: 위
    caption_format: '<표 {n}> {title}';   // <표 1> 제목
    source_format: '출처: {source}';      // 출처 표시
    note_format: '주: {note}';           // 주석 표시
    border_style: 'horizontal_only';     // 상하단 실선만 (3선표)
  };

  // 헤더 형식 (실제 신학과사회 형식 기준)
  header: {
    odd_page: string;  // 홀수 페이지: {title}_{author}  {page}
    even_page: string; // 짝수 페이지: {page}  신학과 사회 30(2) 2016
  };

  // 첫 페이지 하단 정보
  first_page: {
    journal_info: string;  // 신학과 사회 30(2) 2016
    page_range: string;    // pp. 177 - 218
  };

  // 섹션 번호 체계 (공식 규정 2.4: I, II, III → 1, 2, 3 → 1), 2), 3) → ①, ②, ③)
  section_numbering: {
    level1: 'roman';              // I, II, III
    level2: 'arabic';             // 1, 2, 3
    level3: 'parenthesis';        // 1), 2), 3)
    level4: 'circled';            // ①, ②, ③
  };

  // 번호 없는 특수 섹션 (들어가는 글, 나가는 글)
  special_sections: {
    introduction: string[];  // 번호 없이 처리할 서론 제목들
    conclusion: string[];    // 번호 없이 처리할 결론 제목들
  };

  // 각주 설정
  footnote: {
    numbering: 'continuous' | 'per_page';
    format: 'superscript_paren';  // 1), 2), 3)
    separator: '─────────────────';
  };

  // 제목 각주 기호 (연구비 지원 표시용)
  title_footnote_symbol: string;  // ❉ 또는 *
  title_footnote_symbols?: string[];  // 허용되는 기호들: ['❉', '*']

  // 저자 정보 형식 (Claude Desktop 생성 기준)
  author_info: {
    // 본문 내 표시 형식 (각주 없음)
    format_inline: string;       // '{position}, {affiliation}'
    format_inline_full?: string; // '{position}, {department}, {affiliation}'
    use_footnote: boolean;       // false = 본문 표시, true = 각주 표시
  };

  // 저자 각주 형식 (레거시 지원)
  author_footnote: {
    single_author_symbol: string;
    single_author_symbol_no_title?: string;
    multi_author_symbols: string[];
    multi_author_symbols_fullwidth?: string[];
    format_single: string;
    format_single_variants?: string[];
    format_multi: string;
    start_number_with_title_footnote?: number;
    start_number_without_title_footnote?: number;
  };

  // 날짜 라벨 (논문확정일자 vs 게재확정일자)
  date_labels?: {
    received: string;      // 접수일자
    accepted: string;      // 논문확정일자 또는 게재확정일자
    accepted_variants?: string[];  // 허용되는 변형들
  };

  // 영문 초록 저자 형식 (단일/복수 저자 대응)
  abstract_en_author: {
    format_single: string;  // {name}\n({affiliation} / {field})
    format_multi: string;   // {name}\n({position} / {department}, {affiliation})
  };

  // 국문초록 제목 (띄어쓰기 여부)
  abstract_kr_title: string;  // '국문 초록' 또는 '국문초록'
  abstract_kr_title_variants?: string[];  // 허용되는 변형들

  // 첫 페이지 상단 헤더
  first_page_header: {
    show_journal_info: boolean;  // true: 신학과 사회 34(3) 2020
    show_page_range: boolean;    // true: pp. 193 - 235
    format: string;              // '{journal} {volume}({issue}) {year}\npp. {start} - {end}'
  };

  // 첫 페이지 레이아웃 순서
  first_page_layout: string[];  // ['header', 'title', 'author', 'abstract_kr', 'keywords_kr', 'body']
}

// 신학과사회 기본 템플릿 (공식 투고 규정 기반)
export const SHINSA_TEMPLATE: JournalTemplate = {
  journal_name: '신학과 사회',
  volume: 39,
  issue: 2,
  year: 2025,

  // 페이지 설정 (Claude Desktop 생성 기준: 1인치 마진)
  page: {
    size: 'A4',
    margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },  // 1인치 = 25.4mm
    recommended_pages: { min: 10, max: 12 }
  },

  // 폰트 설정 (Claude Desktop 생성 기준)
  fonts: {
    title: { family: 'Times New Roman', size: 16, bold: true },
    subtitle: { family: 'Times New Roman', size: 14, bold: false },
    author: { family: 'Times New Roman', size: 10 },
    body: { family: 'Times New Roman', size: 10, line_spacing: 115 },  // 기본 줄간격 1.15배
    footnote: { family: 'Times New Roman', size: 9 },
    header: { family: 'Times New Roman', size: 9 }
  },

  // 인용 표기 기호 (공식 규정 4장)
  citation_marks: {
    paper_title: { open: '"', close: '"' },      // 논문 제목: " "
    journal: { open: '「', close: '」' },         // 잡지/정기간행물: 「 」
    book_kr: { open: '『', close: '』' },         // 국문 도서: 『 』
    book_foreign: 'italic',                       // 외국어 도서: 이탤릭
    ibid: 'Ibid.'                                 // 반복 인용
  },

  // 참고문헌 정렬 규칙 (공식 규정 5장 + Claude Desktop 기준)
  bibliography: {
    order: ['korean', 'foreign'],                 // 국문 먼저, 외국어 뒤
    korean_sort: 'hangul',                        // 가나다순
    foreign_sort: 'alphabet',                     // 알파벳순
    same_author_mark: '_______',                  // 동일 저자: 7개 언더바
    hanging_indent: 1.5,                          // 둘째 줄 들여쓰기 1.5cm
    // 섹션 헤더 (Claude Desktop 기준)
    section_headers: {
      korean: '<국문 자료>',
      foreign: '<외국어 자료>',
      none_text: '(해당 없음)'
    }
  },

  // 주제어 개수 (공식 규정 6장)
  keywords: {
    min: 5,
    max: 10
  },

  // 표/그림 형식 (실제 논문 기준)
  figures: {
    caption_position: 'below',
    caption_format: '<그림 {n}> {title}',
    source_format: '출처: {source}'
  },

  tables: {
    caption_position: 'above',
    caption_format: '<표 {n}> {title}',
    source_format: '출처: {source}',
    note_format: '주: {note}',
    border_style: 'horizontal_only'      // 3선표 (상단, 헤더하단, 하단)
  },

  // 실제 논문 형식에 맞춘 헤더
  header: {
    odd_page: '{title}_{author}  {page}',         // 홀수: 제목_저자  페이지
    even_page: '{page}  신학과 사회 {volume}({issue}) {year}'  // 짝수: 페이지  저널정보
  },

  // 첫 페이지 하단 정보
  first_page: {
    journal_info: '신학과 사회 {volume}({issue}) {year}',
    page_range: 'pp. {start} - {end}'
  },

  // 섹션 번호 체계 (공식 규정 2.4)
  section_numbering: {
    level1: 'roman',              // I, II, III
    level2: 'arabic',             // 1, 2, 3
    level3: 'parenthesis',        // 1), 2), 3)
    level4: 'circled'             // ①, ②, ③
  },

  // 번호 없이 처리할 특수 섹션
  special_sections: {
    introduction: ['들어가는 글', '들어가는 말', '서론', 'Introduction'],
    conclusion: ['나가는 글', '나가는 말', '결론', '맺는 글', '맺는 말', 'Conclusion']
  },

  footnote: {
    numbering: 'continuous',
    format: 'superscript_paren',
    separator: '─────────────────'
  },

  // 제목 각주 기호 (연구비 지원 표시)
  title_footnote_symbol: '*',
  title_footnote_symbols: ['*', '❉'],

  // 저자 정보 형식 (Claude Desktop 생성 기준: 각주 없이 본문에 표시)
  author_info: {
    format_inline: '{position}, {affiliation}',  // Dean, Jeonbuk Sophia International College
    format_inline_full: '{position}, {department}, {affiliation}',
    use_footnote: false  // 본문에 직접 표시 (각주 사용 안 함)
  },

  // 저자 각주 형식 (2025년 기준, 단일/복수 저자 대응)
  author_footnote: {
    single_author_symbol: '**',           // 2025년: 제목각주(*) 있으면 저자는 **
    single_author_symbol_no_title: '*',   // 제목각주 없으면 저자는 *
    // 복수저자 기호: 반각(*) 우선, 전각(＊)은 레거시
    multi_author_symbols: ['*', '**', '***', '****', '*****'],  // 반각 별표 (2025년 기준)
    multi_author_symbols_fullwidth: ['＊', '＊＊', '＊＊＊', '＊＊＊＊'],  // 전각 별표 (2019년 이전 레거시)
    // 2025년 기본 형식: 소속/직위/전공/이메일 (4필드)
    format_single: '{affiliation}/ {position}/ {field}/ {email}',
    // 레거시 형식들 (하위 호환)
    format_single_variants: [
      '{affiliation}/ {position}/ {field}/ {email}',  // 2025년 기준 (4필드)
      '{affiliation}/ {position}/ {email}',           // 3필드 (2019년)
      '{affiliation}/ {field}    {email}',            // 구형식 (공백 4칸)
      '{affiliation} / {field}, {email}',             // 2011년 레거시 (쉼표)
      '{affiliation}/ {field}/ {email}'               // 슬래시 일관 형식
    ],
    format_multi: '{role}/ {affiliation}/ {position}/ {field}/ {email}',
    // 예: 제1저자/ 고려대학교 민족문화연구원/ 포닥 연구교수/ 종교학/ kjmif@naver.com
    start_number_with_title_footnote: 2,  // 제목각주 있으면 저자각주는 2번부터
    start_number_without_title_footnote: 1  // 제목각주 없으면 1번부터
  },

  // 날짜 라벨 (2025년 기준)
  date_labels: {
    received: '접수일자',
    accepted: '논문확정일자',  // 2025년 기본값
    accepted_variants: ['논문확정일자', '게재확정일자']  // 레거시: 게재확정일자 (2011년 이전)
  },

  // 영문 초록 저자 형식 (2025년 기준)
  abstract_en_author: {
    // 2025년 기본: 이름 + (소속/전공)
    format_single: '{name}\n({affiliation} / {field})',
    format_multi: '{name}\n({position} /\n{department}, {affiliation})'
  },

  // 국문초록 제목 (Claude Desktop 생성 기준: 공백 있음)
  abstract_kr_title: '국문 초록',  // Claude Desktop 기준 (공백 있음)
  abstract_kr_title_variants: ['국문 초록', '국문초록'],  // 둘 다 허용

  // 첫 페이지 상단 헤더 (저널정보 + 페이지범위)
  first_page_header: {
    show_journal_info: true,
    show_page_range: true,
    format: '{journal} {volume}({issue}) {year}\npp. {start} - {end}'
  },

  // 첫 페이지 레이아웃 순서
  first_page_layout: ['header', 'title', 'author', 'abstract_kr', 'keywords_kr', 'body', 'references', 'abstract_en', 'keywords_en']
};

// 에세이 → 논문 변환 결과
export interface FormattedPaper {
  // 메타데이터
  metadata: {
    title: string;
    subtitle?: string;
    author: string;
    affiliation: string;
    field?: string;      // 전공 분야 (예: 신학, 기독교역사)
    email?: string;
    funding?: string;    // 연구비 지원 정보
  };

  // 구조화된 콘텐츠
  abstract_kr: string;
  keywords_kr: string[];

  body: FormattedSection[];

  references: string[];

  abstract_en: string;
  keywords_en: string[];

  // 각주 목록
  footnotes: { number: number; content: string }[];

  // 페이지 헤더
  headers: {
    page: number;
    content: string;
  }[];
}

export interface FormattedSection {
  level: 1 | 2 | 3;  // I=1, 1.=2, 1)=3
  number: string;     // "I", "1", "1)"
  title: string;
  content: string;
  footnote_refs: number[];  // 본문 내 각주 참조 번호
}

// 로마 숫자 변환
export function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

// 원형 숫자 변환 (①, ②, ③, ... ⑳)
export function toCircledNumber(num: number): string {
  const circledNumbers = [
    '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
    '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'
  ];
  if (num >= 1 && num <= 20) {
    return circledNumbers[num - 1];
  }
  return `(${num})`;  // 20 초과시 괄호 숫자
}

// 섹션 번호 생성 (4단계 지원: I. → 1. → 1) → ①)
export function generateSectionNumber(
  level: 1 | 2 | 3 | 4,
  chapterNum: number,
  sectionNum?: number,
  subsectionNum?: number,
  subsubsectionNum?: number
): string {
  switch (level) {
    case 1:
      return `${toRoman(chapterNum)}.`;
    case 2:
      return `${sectionNum}.`;
    case 3:
      return `${subsectionNum})`;
    case 4:
      return toCircledNumber(subsubsectionNum || 1);
  }
}

// 페이지 헤더 생성 (실제 신학과사회 형식)
export function generateHeader(
  template: JournalTemplate,
  pageNum: number,
  title: string,
  author?: string
): string {
  if (pageNum % 2 === 0) {
    // 짝수 페이지: {page}  신학과 사회 30(2) 2016
    return template.header.even_page
      .replace('{page}', String(pageNum))
      .replace('{volume}', String(template.volume))
      .replace('{issue}', String(template.issue))
      .replace('{year}', String(template.year));
  } else {
    // 홀수 페이지: {title}_{author}  {page}
    const maxLen = 35;
    const displayTitle = title.length > maxLen
      ? title.substring(0, maxLen - 3) + '...'
      : title;
    const authorName = author || '';
    return template.header.odd_page
      .replace('{title}', displayTitle)
      .replace('{author}', authorName)
      .replace('{page}', String(pageNum));
  }
}

// 첫 페이지 하단 정보 생성
export function generateFirstPageFooter(
  template: JournalTemplate,
  startPage: number,
  endPage: number
): { journalInfo: string; pageRange: string } {
  const journalInfo = template.first_page.journal_info
    .replace('{volume}', String(template.volume))
    .replace('{issue}', String(template.issue))
    .replace('{year}', String(template.year));

  const pageRange = template.first_page.page_range
    .replace('{start}', String(startPage))
    .replace('{end}', String(endPage));

  return { journalInfo, pageRange };
}

// 특수 섹션 여부 확인 (들어가는 글, 나가는 글 등)
export function isSpecialSection(
  template: JournalTemplate,
  sectionTitle: string
): boolean {
  const allSpecial = [
    ...template.special_sections.introduction,
    ...template.special_sections.conclusion
  ];
  return allSpecial.some(s =>
    sectionTitle.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(sectionTitle.toLowerCase())
  );
}

// 저자 각주 생성 (단일 저자용, 레거시 호환)
export function generateAuthorFootnote(
  template: JournalTemplate,
  affiliation: string,
  field?: string,
  email?: string
): string {
  return template.author_footnote.format_single
    .replace('{affiliation}', affiliation)
    .replace('{field}', field || '')
    .replace('{email}', email || '');
}

// 제목 각주 생성 (연구비 지원 표시)
export function generateTitleFootnote(
  template: JournalTemplate,
  fundingInfo: string
): string {
  return `${template.title_footnote_symbol}${fundingInfo}`;
}

// 영문 초록 저자 정보 생성 (레거시 호환 - 단일 저자)
export function generateAbstractEnAuthor(
  template: JournalTemplate,
  name: string,
  affiliation: string,
  field?: string
): string {
  return template.abstract_en_author.format_single
    .replace('{name}', name)
    .replace('{affiliation}', affiliation)
    .replace('{field}', field || '');
}

// 저자 각주 기호 생성 (레거시 호환 - 단일 저자)
export function generateAuthorFootnoteSymbol(
  template: JournalTemplate,
  authorIndex: number = 1
): string {
  return template.author_footnote.single_author_symbol
    .replace('{n}', String(authorIndex));
}

// 영문 초록 저자 정보 생성 - 단일 저자
export function generateAbstractEnAuthorSingle(
  template: JournalTemplate,
  name: string,
  affiliation: string,
  field?: string
): string {
  return template.abstract_en_author.format_single
    .replace('{name}', name)
    .replace('{affiliation}', affiliation)
    .replace('{field}', field || '');
}

// 영문 초록 저자 정보 생성 - 복수 저자
export function generateAbstractEnAuthorMulti(
  template: JournalTemplate,
  name: string,
  position: string,
  department: string,
  affiliation: string
): string {
  return template.abstract_en_author.format_multi
    .replace('{name}', name)
    .replace('{position}', position)
    .replace('{department}', department)
    .replace('{affiliation}', affiliation);
}

// 저자 각주 기호 생성 - 단일 저자 (*1) 형식)
export function generateAuthorFootnoteSymbolSingle(
  template: JournalTemplate,
  authorIndex: number
): string {
  return template.author_footnote.single_author_symbol.replace('{n}', String(authorIndex));
}

// 저자 각주 기호 생성 - 복수 저자 (**, *** 형식)
export function generateAuthorFootnoteSymbolMulti(
  template: JournalTemplate,
  authorIndex: number
): string {
  const symbols = template.author_footnote.multi_author_symbols;
  return symbols[authorIndex] || '*'.repeat(authorIndex + 2);
}

// 저자 각주 내용 생성 - 단일 저자
export function generateAuthorFootnoteSingle(
  template: JournalTemplate,
  affiliation: string,
  field?: string,
  email?: string
): string {
  return template.author_footnote.format_single
    .replace('{affiliation}', affiliation)
    .replace('{field}', field || '')
    .replace('{email}', email || '');
}

// 저자 각주 내용 생성 - 복수 저자
export function generateAuthorFootnoteMulti(
  template: JournalTemplate,
  role: string,        // 제1저자, 교신저자
  affiliation: string,
  position: string,    // 포닥 연구교수, 교수
  field: string,
  email: string
): string {
  return template.author_footnote.format_multi
    .replace('{role}', role)
    .replace('{affiliation}', affiliation)
    .replace('{position}', position)
    .replace('{field}', field)
    .replace('{email}', email);
}

// 첫 페이지 헤더 생성
export function generateFirstPageHeader(
  template: JournalTemplate,
  startPage: number,
  endPage: number
): string {
  if (!template.first_page_header.show_journal_info) {
    return '';
  }

  let header = template.first_page_header.format
    .replace('{journal}', template.journal_name)
    .replace('{volume}', String(template.volume))
    .replace('{issue}', String(template.issue))
    .replace('{year}', String(template.year));

  if (template.first_page_header.show_page_range) {
    header = header
      .replace('{start}', String(startPage))
      .replace('{end}', String(endPage));
  }

  return header;
}

// 저자 각주 시작 번호 계산 (제목 각주 유무에 따라)
export function getAuthorFootnoteStartNumber(
  template: JournalTemplate,
  hasTitleFootnote: boolean
): number {
  if (hasTitleFootnote) {
    return template.author_footnote.start_number_with_title_footnote || 2;
  }
  return template.author_footnote.start_number_without_title_footnote || 1;
}

// 저자 각주 기호 생성 (제목 각주 유무 고려)
export function generateAuthorFootnoteSymbolWithContext(
  template: JournalTemplate,
  authorIndex: number,
  hasTitleFootnote: boolean
): string {
  const startNumber = getAuthorFootnoteStartNumber(template, hasTitleFootnote);
  const footnoteNumber = startNumber + authorIndex - 1;
  return template.author_footnote.single_author_symbol
    .replace('{n}', String(footnoteNumber));
}

// 제목 각주 기호 유효성 검사
export function isValidTitleFootnoteSymbol(
  template: JournalTemplate,
  symbol: string
): boolean {
  const validSymbols = template.title_footnote_symbols || [template.title_footnote_symbol];
  return validSymbols.includes(symbol);
}

// 국문초록 제목 유효성 검사
export function isValidAbstractKrTitle(
  template: JournalTemplate,
  title: string
): boolean {
  const validTitles = template.abstract_kr_title_variants || [template.abstract_kr_title];
  return validTitles.includes(title);
}

// 날짜 라벨 유효성 검사 (논문확정일자 vs 게재확정일자)
export function isValidAcceptedDateLabel(
  template: JournalTemplate,
  label: string
): boolean {
  if (!template.date_labels) return true;  // date_labels 없으면 모두 허용
  const validLabels = template.date_labels.accepted_variants || [template.date_labels.accepted];
  return validLabels.includes(label);
}

// 저자 각주 형식 유효성 검사
export function isValidAuthorFootnoteFormat(
  template: JournalTemplate,
  format: string
): boolean {
  const validFormats = template.author_footnote.format_single_variants ||
    [template.author_footnote.format_single];
  return validFormats.includes(format);
}

// 저자 각주 형식 선택 (쉼표 vs 공백 구분)
export function selectAuthorFootnoteFormat(
  template: JournalTemplate,
  useComma: boolean = false
): string {
  if (!useComma) {
    return template.author_footnote.format_single;
  }
  // 쉼표 형식 찾기
  const commaFormat = template.author_footnote.format_single_variants?.find(f => f.includes(','));
  return commaFormat || template.author_footnote.format_single;
}
