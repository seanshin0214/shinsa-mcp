# shinsa-mcp

「신학과 사회」 학술지 논문 작성 지원 MCP 서버

## 기능

### 1. 인용 형식 변환
- 10가지 인용 유형 지원 (국문 논문, 단행본, 번역서, 외국 문헌 등)
- 각주 ↔ 참고문헌 형식 자동 변환
- 번역서 슬래시(/) 규칙 자동 적용
- 외국 저자 Last, First 형식 변환

### 2. RAG 기반 인용 사례 검색
- Supabase pgvector를 활용한 유사 인용 검색
- 기존 논문의 인용 형식 참고 가능

### 3. 논문 포맷팅
- 문단/텍스트 학술 스타일 변환
- 논문 전체 구조화
- 형식 요건 체크리스트
- 논문 유형별 구조 제안

### 4. 스타일 가이드 리소스
- 논문 작성 완전 가이드
- 인용 형식 빠른 참조
- 논문 템플릿

## 설치

### 1. 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/shinsa-mcp.git
cd shinsa-mcp
npm install
npm run build
```

### 2. Supabase 설정 (RAG 기능용)

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

#### 2.3 OpenAI API 키
[OpenAI Platform](https://platform.openai.com)에서 API 키 생성

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

| 도구 | 설명 |
|------|------|
| `convert_citation` | 인용을 각주/참고문헌 형식으로 변환 |
| `batch_convert` | 여러 인용 일괄 변환 |
| `validate_citation` | 형식 규정 준수 검증 |
| `search_examples` | RAG: 유사 인용 사례 검색 |
| `get_paper_examples` | RAG: 특정 논문 인용 조회 |
| `format_paragraph` | 문단 스타일 포맷팅 |
| `format_paper` | 논문 전체 구조화 |
| `check_format` | 형식 요건 체크 |
| `suggest_structure` | 논문 구조 제안 |
| `get_stats` | DB 통계 |

## 리소스

| URI | 설명 |
|-----|------|
| `shinsa://style-guide` | 논문 작성 완전 가이드 |
| `shinsa://citation-guide` | 인용 형식 빠른 참조 |
| `shinsa://template` | 논문 템플릿 |

## 사용 예시

```
# 인용 변환
"Max Weber의 프로테스탄티즘의 윤리와 자본주의 정신을
신학과사회 각주 형식으로 변환해줘"

# 문단 포맷팅
"이 문단을 신학과사회 논문 스타일로 다듬어줘: [텍스트]"

# 논문 구조 제안
"'한국교회와 사회윤리' 주제로 논문 구조 제안해줘"

# 형식 체크
"내 논문이 신학과사회 형식에 맞는지 체크해줘"

# RAG 검색 (Supabase 설정 필요)
"번역서 인용 형식 사례를 검색해줘"
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

## 라이선스

MIT
