# Pointer Pointer 분석

확인일: 2026-10-21. 공개 배포 JavaScript/CSS/JSON의 정적 분석입니다. 브라우저 실행 검증이나 서버 내부 분석은 수행하지 않았습니다.

## 확인한 동작

1. React 훅으로 화면 크기와 포인터 위치를 관리합니다. hover 지원 여부에 따라 입력 방식을 나누며, 터치 화면에는 cursor.png를 표시합니다.
2. 위치 변경이 멈춘 후 2,000ms에 안정된 좌표를 전달합니다. 안내 문구는 별도로 1,200ms 후 변경됩니다. 두 타이머는 순차 합산이 아닙니다.
3. /new-positions.json에서 711개 [x,y] 좌표를 읽습니다. 각 값은 0~1 범위의 비율입니다.
4. 커서 좌표를 (x / 화면너비, y / 화면높이)로 정규화합니다.
5. 모든 후보를 순회하며 거리 제곱 (px-qx)^2 + (py-qy)^2가 가장 작은 항목을 선택합니다. 최근 선택한 4개 인덱스는 제외합니다. 별도 검색 서버 호출 없이 이 계산은 클라이언트 코드에 있습니다.
6. 선택한 인덱스 i로 /images/i.jpg를 로드합니다. 711개는 좌표 레코드 수이며, 모든 이미지의 존재를 개별 확인한 것은 아닙니다.
7. 이미지를 화면에 맞게 비율 유지 확대하고 이동시킨 뒤, 저장 좌표를 transform-origin으로 삼아 1.2배 확대합니다. 동일 이미지를 blur(8px) 및 추가 scale(1.1)로 뒤에 겹칩니다.

## 정렬 수식

커서 픽셀 좌표를 P, 저장된 사진 좌표를 q, 화면에 맞춰 확대된 이미지 크기를 R이라고 하면 코드의 translate는 P - q*R로 정리됩니다. 따라서 사진의 저장 지점 q*R은 이동 후 정확히 P에 놓입니다. 이후 q 지점을 중심으로 확대하므로 그 위치가 유지됩니다.

예시: 커서 P=(600,400), q=(0.55,0.45), R=(1000,800)이면 translate=(50,40)입니다. 저장 지점 (550,360)이 커서 (600,400)에 맞춰집니다.

## 관찰과 해석

- 관찰: 사전 좌표 JSON, 최근 인덱스 제외, 거리 비교, 인덱스 기반 JPG 로드, CSS 변환이 배포 코드에 있습니다.
- 해석: 각 좌표는 사진 속 가리키는 지점을 나타내도록 준비된 것으로 보입니다. 조사한 선택 경로는 좌표 검색과 이미지 정렬로 설명되며 AI 추론을 요구하지 않습니다.
- 미확인: 좌표의 수동/자동 제작 방식, 사진 수집 출처, 서버 내부 구성, 전체 사진 유효성, 실제 브라우저에서의 성공 여부.

## 출처 및 REA 근거

- https://pointerpointer.com/
- https://pointerpointer.com/static/js/main.919b6db1.chunk.js
- https://pointerpointer.com/static/css/main.326af8f0.chunk.css
- https://pointerpointer.com/new-positions.json

REA parent Evidence: ev_01ceca835a816daca5dba83abd316fbb4888a9132806d97554ae0b464bee03bd

REA summary Evidence: ev_afd3a25b9d21072a6f9823d9a7b71f793d0bc5fa54ffe41d565b1a1de3f5fe91

REA는 수집한 파일을 실행 없이 분석했습니다. 자동 관계 그래프는 partial이고 동적 호출 및 미수집 라이브러리의 의미는 완전히 해석되지 않았습니다. 위 알고리즘은 배포 본문 직접 검토와 JSON 계수로 보완했습니다. 서버 전체나 모든 의존성을 분석했다는 의미는 아닙니다.

### 수집 파일 SHA-256

- index.html: `d2ad5579ded25bc603dede7d824bd3b5e361bcece86d467af19b1c62c6bc8113`
- main.css: `8a2297ad7a774cf3c1952900767c25894caad18e4fc06bedce2a15859ff284a4`
- main.js: `5db64dbc285de87f3ad4df88e84ded3ad5077eedc2495f6899bf962b385ca73a`
- new-positions.json: `3f133f98ed0611edd4027070757b9b9f6c6c720f9d845795af63cea16d36a6a6`