# shinsa-mcp

「신학과 사회」 학술지 논문 작성 지원 MCP 서버

**2025년 템플릿 기준** - A/B 테스트를 통해 2011~2025년 논문 형식을 모두 지원합니다.

## 주요 기능

### 1. 에세이 → 논문 변환 (NEW)
- **에세이를 완벽한 신학과사회 형식 논문으로 자동 변환**
- 페이지 헤더/번호 자동 생성
- 섹션 번호 (I. II. III.) 자동 부여
- 각주/참고문헌 형식 자동 변환
- Markdown 및 Word 호환 HTML 출력

### 2. 인용 형식 변환
- 10가지 인용 유형 지원 (국문 논문, 단행본, 번역서, 외국 문헌 등)
- 각주 ↔ 참고문헌 형식 자동 변환
- 번역서 슬래시(/) 규칙 자동 적용
- 외국 저자 Last, First 형식 변환

### 3. RAG 기반 인용 사례 검색
- Supabase pgvector를 활용한 유사 인용 검색
- 기존 논문의 인용 형식 참고 가능

### 4. 논문 포맷팅
- 문단/텍스트 학술 스타일 변환
- 논문 전체 구조화
- 형식 요건 체크리스트
- 논문 유형별 구조 제안

### 5. 스타일 가이드 리소스
- 논문 작성 완전 가이드
- 인용 형식 빠른 참조
- 논문 템플릿

## 2025년 템플릿 사양

### 저자 각주 형식
```
{affiliation}/ {position}/ {field}/ {email}
예: 강남대학교/ 부교수/ 교회사/ professor@kangnam.ac.kr
```

### 제목 각주 기호
- 2025년 기준: `*` (반각 별표)
- 레거시 지원: `❉`

### 저자 각주 기호
- 제목각주 있을 때: `**`
- 제목각주 없을 때: `*`
- 복수저자: `*`, `**`, `***`, `****`
- 전각 별표 레거시 지원: `＊`, `＊＊`

### 국문초록 제목
- 2025년 기준: `국문초록` (붙여쓰기)
- 레거시 지원: `국문 초록` (공백)

### 날짜 라벨
- 2025년 기준: `논문확정일자`
- 레거시 지원: `게재확정일자`

## 설치

### 1. 저장소 클론
```bash
git clone https://github.com/zeptolime/shinsa-mcp.git
cd shinsa-mcp
npm install
npm run build
```

### 2. Supabase 설정 (RAG 기능용, 선택사항)

#### 2.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 가입 및 새 프로젝트 생성
2. Project Settings > API에서 URL과 anon key 복사

#### 2.2 pgvector 테이블 생성
Supabase SQL Editor에서 실행:

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 인용 테이블 생성
CREATE TABLE citations (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  citation_type TEXT,
  paper_title TEXT,
  paper_author TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 검색 인덱스
CREATE INDEX ON citations
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 유사도 검색 함수
CREATE OR REPLACE FUNCTION match_citations(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  citation_type TEXT,
  paper_title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.citation_type,
    c.paper_title,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM citations c
  WHERE (filter_type IS NULL OR c.citation_type = filter_type)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 3. Claude Desktop 설정

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "shinsa": {
      "command": "node",
      "args": ["경로/shinsa-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_KEY": "your-supabase-anon-key",
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

> **참고**: RAG 기능 없이 인용 변환/포맷팅만 사용하려면 env 설정 없이도 동작합니다.

## 도구 목록

### 에세이 → 논문 변환
| 도구 | 설명 |
|------|------|
| `convert_essay_to_paper` | 에세이를 신학과사회 형식 논문으로 변환 |
| `get_journal_template` | 저널 템플릿 정보 반환 |

### 인용 변환
| 도구 | 설명 |
|------|------|
| `convert_citation` | 인용을 각주/참고문헌 형식으로 변환 |
| `batch_convert` | 여러 인용 일괄 변환 |
| `validate_citation` | 형식 규정 준수 검증 |

### RAG 검색
| 도구 | 설명 |
|------|------|
| `search_examples` | 유사 인용 사례 검색 |
| `get_paper_examples` | 특정 논문 인용 조회 |

### 논문 포맷팅
| 도구 | 설명 |
|------|------|
| `format_paragraph` | 문단 스타일 포맷팅 |
| `format_paper` | 논문 전체 구조화 |
| `check_format` | 형식 요건 체크 |
| `suggest_structure` | 논문 구조 제안 |

### 유틸리티
| 도구 | 설명 |
|------|------|
| `get_stats` | DB 통계 |

## 리소스

| URI | 설명 |
|-----|------|
| `shinsa://style-guide` | 논문 작성 완전 가이드 |
| `shinsa://citation-guide` | 인용 형식 빠른 참조 |
| `shinsa://template` | 논문 템플릿 |

## 사용 예시

### 에세이 → 논문 변환 (핵심 기능)
```
"이 에세이를 신학과사회 논문으로 변환해줘:

제목: 현대 한국교회의 사회윤리적 과제
저자: 홍길동
소속: 강남대학교 신학과 교수

[본문 텍스트...]"
```

### 인용 변환
```
"Max Weber의 프로테스탄티즘의 윤리와 자본주의 정신을
신학과사회 각주 형식으로 변환해줘"
```

### 문단 포맷팅
```
"이 문단을 신학과사회 논문 스타일로 다듬어줘: [텍스트]"
```

### 논문 구조 제안
```
"'한국교회와 사회윤리' 주제로 논문 구조 제안해줘"
```

### 형식 체크
```
"내 논문이 신학과사회 형식에 맞는지 체크해줘"
```

## 인용 규정 요약

### 기호
- 국문 논문 제목: `" "`
- 국문 학술지명: `「 」`
- 국문 단행본: `『 』`
- 외국어 학술지/단행본: `*이탤릭*`

### 각주 vs 참고문헌
| 구분 | 각주 | 참고문헌 |
|------|------|----------|
| 구분자 | 콤마(,) | 마침표(.) |
| 출판정보 | (괄호) | 괄호 없음 |
| 외국저자 | First Last | Last, First |

### 핵심 규칙
- **번역서**: 반드시 슬래시 사용 → `Weber / 박성수 옮김`
- **참고문헌 순서**: 국문(가나다) → 외국어(알파벳)

## A/B 테스트 논문 목록

템플릿 검증에 사용된 논문:
- KCI_FI002109423 (단일저자, *1))
- KCI_FI002620152 (복수저자, **, ***)
- KCI_FI001988131 (2015년, ❉ 기호)
- KCI_FI001642097 (2011년, 게재확정일자)
- KCI_FI002495141 (2019년, 전각 별표)
- 2-39-2 이민규 (2025년 기준)

## 라이선스

MIT

## 기여

이슈 및 PR 환영합니다.

## 저자

- GitHub: [@zeptolime](https://github.com/zeptolime)
