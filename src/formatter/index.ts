// 포맷터 모듈 내보내기

export {
  JournalTemplate,
  FormattedPaper,
  FormattedSection,
  SHINSA_TEMPLATE,
  toRoman,
  toCircledNumber,
  generateSectionNumber,
  generateHeader,
  generateFirstPageFooter,
  isSpecialSection,
  generateAuthorFootnote,
  generateTitleFootnote,
  generateAbstractEnAuthor,
  generateAuthorFootnoteSymbol,
  // 단일/복수 저자 대응 함수들
  generateAbstractEnAuthorSingle,
  generateAbstractEnAuthorMulti,
  generateAuthorFootnoteSymbolSingle,
  generateAuthorFootnoteSymbolMulti,
  generateAuthorFootnoteSingle,
  generateAuthorFootnoteMulti,
  generateFirstPageHeader,
  // 제목 각주 유무에 따른 저자 각주 번호 계산
  getAuthorFootnoteStartNumber,
  generateAuthorFootnoteSymbolWithContext,
  // 유효성 검사 함수들
  isValidTitleFootnoteSymbol,
  isValidAbstractKrTitle,
  isValidAcceptedDateLabel,
  isValidAuthorFootnoteFormat,
  selectAuthorFootnoteFormat
} from './template.js';

export {
  EssayInput,
  ConversionOptions,
  convertEssayToPaper,
  toMarkdown,
  toWordHTML
} from './converter.js';

// 2025년 형식 체크리스트
export {
  SHINSA_2025_CHECKLIST,
  getChecklistByCategory,
  getChecklistSummary,
  checkItem,
  generateValidationReport,
  type FormatCheckItem,
  type FormatCheckResult,
  type ValidationReport
} from './checklist.js';
