// 인용 유형 (10가지)
export type CitationType =
  | 'korean_article'      // 국문 학술논문
  | 'korean_book'         // 국문 단행본
  | 'korean_chapter'      // 단행본 내 챕터
  | 'korean_translation'  // 번역서
  | 'foreign_article'     // 외국어 논문
  | 'foreign_book'        // 외국어 단행본
  | 'thesis'              // 학위논문
  | 'web'                 // 인터넷 자료
  | 'bible'               // 성경
  | 'ibid'                // 반복 인용
  | 'short_ref'           // 약식 반복
  | 'unknown';            // 파싱 실패

// 인용 필드 (모든 유형 통합)
export interface CitationFields {
  // 공통 필드
  author?: string;
  title?: string;
  year?: string;
  page?: string;

  // 학술논문 전용
  journal?: string;
  volume?: string;
  issue?: string;

  // 단행본 전용
  city?: string;
  publisher?: string;
  edition?: string;

  // 번역서 전용
  originalAuthor?: string;
  translator?: string;

  // 챕터 전용
  bookTitle?: string;
  editor?: string;

  // 학위논문 전용
  degree?: 'doctoral' | 'master';
  university?: string;

  // 인터넷 자료 전용
  url?: string;
  accessDate?: string;

  // 성경 전용
  book?: string;
  chapter?: string;
  verse?: string;
  version?: string;

  // 반복 인용 전용
  isIbid?: boolean;
  previousRef?: string;
}

// 파싱된 인용 정보
export interface ParsedCitation {
  id: number;
  original: string;
  type: CitationType;
  confidence: number;
  fields: CitationFields;
  warnings?: string[];
}

// 변환 결과
export interface ConversionResult {
  footnote: string;
  bibliography: string;
  warnings?: string[];
}

// 추출 결과
export interface ExtractionResult {
  citations: ParsedCitation[];
  unrecognized: string[];
  stats: {
    total: number;
    parsed: number;
    failed: number;
    byType: Partial<Record<CitationType, number>>;
  };
}

// 검증 결과
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  suggestions: string[];
  corrected?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  expected?: string;
  actual?: string;
}

// 배치 변환 결과
export interface BatchConvertResult {
  footnotes: Array<{ original: string; converted: string }>;
  bibliography: string[];
  stats: {
    total: number;
    converted: number;
    failed: number;
    byType: Partial<Record<CitationType, number>>;
  };
  warnings: string[];
}

// RAG 검색 결과
export interface RAGSearchResult {
  content: string;
  type: string;
  paper: string;
  similarity: number;
}
