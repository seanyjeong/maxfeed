  let currentFeedEndpoint = '/feeds';
const limit = 10;
let loading = false; // 초기화
let done = false;
const loadedFeedIds = new Set();
  

class EmojiButton {
  constructor(options = {}) {
    this.options = options;
    this.picker = document.createElement('div');
    this.picker.classList.add('emoji-button');

    // ✅ 기본 스타일
    Object.assign(this.picker.style, {
      position: 'absolute',
      display: 'none',
      flexWrap: 'wrap',
      gap: '6px',
      background: '#fff',
      border: '1px solid #ccc',
      padding: '8px',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: '9999',
      width: '200px',           // ✅ 고정 너비
      maxHeight: '160px',       // ✅ 스크롤을 위한 최대 높이
      overflowY: 'auto',
      boxSizing: 'border-box',
      fontSize: '20px',
    });

    // ✅ 이모지 목록
    const emojis = ['😀','😅','😂','🤣','😊','😍','😘','😎','😢','😭','😡','🤔','👍','👎','👏','🙏','💪','🔥','🎉','❤️'];
    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      Object.assign(btn.style, {
        width: '30px',
        height: '30px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        padding: '0',
      });

      btn.addEventListener('click', () => {
        if (this._onEmoji) this._onEmoji(emoji);
        this.hidePicker();
      });

      this.picker.appendChild(btn);
    });
  }

  on(event, callback) {
    if (event === 'emoji') {
      this._onEmoji = callback;
    }
  }

  togglePicker(trigger) {
  const rect = trigger.getBoundingClientRect();
  const parent = trigger.parentElement;

  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  if (!this.picker.parentElement) {
    parent.appendChild(this.picker);
  }

  const parentRect = parent.getBoundingClientRect();
  let left = rect.left - parentRect.left;
  const top = rect.bottom - parentRect.top + 8;

  // ✅ 피커가 오른쪽을 넘는 경우 → 왼쪽으로 보정
  const pickerWidth = 200; // 이모지 박스 너비
  const maxLeft = parent.clientWidth - pickerWidth;
  if (left > maxLeft) {
    left = maxLeft;
  }
  if (left < 0) {
    left = 0; // 음수로 넘어가지 않도록
  }

  this.picker.style.left = `${left}px`;
  this.picker.style.top = `${top}px`;
  this.picker.style.display = (this.picker.style.display === 'none') ? 'flex' : 'none';
}


  hidePicker() {
    this.picker.style.display = 'none';
  }
}


  
const api = 'https://supermax.kr/feed';


// ✅ 피드 업로드 완료 메시지 체크
const pendingUpload = localStorage.getItem("pendingUpload");
if (pendingUpload === "true") {
  setTimeout(() => {
    showToast("✅ 피드 업로드 완료!");
    localStorage.removeItem("pendingUpload");
  }, 1500);
}

// ✅ 토스트 함수 정의
function showToast(msg) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = "rgba(33, 33, 33, 0.85)";
toast.style.backdropFilter = "blur(6px)";
toast.style.fontSize = "0.95rem";
toast.style.fontWeight = "500";

  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = 9999;
  toast.style.opacity = 0;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.transition = 'opacity 0.3s'; toast.style.opacity = 1; }, 10);
  setTimeout(() => { toast.style.opacity = 0; setTimeout(() => toast.remove(), 300); }, 2000);
}

let page = 1;


const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !loading && !done) {
    loading = true;
    console.log("🌀 무한스크롤 triggered, page:", page);
    await loadFeeds(currentFeedEndpoint, page);
    loading = false;
  }
}, { threshold: 1 });

observer.observe(document.getElementById('scroll-anchor'));



init(); // ✅ 초기 실행









async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${api}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("✅ 로그인 성공, 응답 데이터:", data);

        if (data.user_id !== undefined && data.user_id !== null) {  
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_id', String(data.user_id));  // ✅ user_id 저장
            console.log("🚀 `user_id` 저장 시도:", data.user_id);

            // ✅ 저장 후 100ms 뒤에 다시 확인 (Chrome 버그 방지)
            setTimeout(() => {
                const savedUserId = localStorage.getItem("user_id");
                console.log("✅ 저장 후 확인 user_id:", savedUserId);

                if (savedUserId && savedUserId !== "undefined") {
                    console.log("✅ `user_id` 저장 성공!");
                    checkUser();  // ✅ 네비게이션 업데이트
                    location.href = 'index.html';  // ✅ 페이지 이동
                } else {
                    console.error("❌ `user_id` 저장 실패! LocalStorage 확인 필요");
                }
            }, 100);
        } else {
            console.error("❌ 서버 응답에 user_id 없음:", data);
            alert("로그인 실패: user_id가 없습니다.");
        }
    } else {
        console.error("❌ 로그인 실패:", res.status);
        alert("로그인 실패");
    }
}





console.log("🛠 페이지 로드됨 - LocalStorage 확인");
console.log("🔹 현재 저장된 token:", localStorage.getItem('token'));
console.log("🔹 현재 저장된 user_id:", localStorage.getItem('user_id'));





// ✅ 로그인 상태 확인 및 네비게이션 바 업데이트
async function checkUser() {
    const token = localStorage.getItem('token');
    let userId = localStorage.getItem('user_id');

    if (!token) return;  // ✅ 토큰이 없으면 로그인하지 않은 상태

    try {
        const res = await fetch(`${api}/user-info`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.ok) {
            const data = await res.json();

            // ✅ user_id가 `undefined`, `"null"`, `"undefined"`이면 덮어쓰기
            if (!userId || userId === "null" || userId === "undefined") {
                console.log("⚠️ `user_id`가 이상함, 서버 데이터로 덮어쓰기:", data.user_id);
                localStorage.setItem('user_id', String(data.user_id));
                userId = localStorage.getItem('user_id'); // 다시 가져오기
            }

            console.log("✅ 최종 확인 user_id:", userId);

            // ✅ 네비게이션 UI 업데이트
            const userName = data.name || "사용자";
            const profileImage = data.profile_image || "https://placehold.co/40x40";

            document.getElementById('user-info').innerHTML = `
                <div class="profile-info">
                    <img src="${profileImage}">
                    <strong>${userName}</strong>
                </div>
            `;

            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('register-btn').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'inline';
            document.getElementById('profile-btn').style.display = 'inline';
        } else {
            console.error("❌ 사용자 정보 불러오기 실패:", res.status);
        }
    } catch (error) {
        console.error("❌ checkUser() 오류:", error);
    }
}




// ✅ 로그아웃 처리
function logout() {
    console.log("🚀 로그아웃 실행!");

    localStorage.removeItem('token');  
    localStorage.removeItem('user_id');

    console.log("✅ 로그아웃 후 LocalStorage 상태:");
    console.log("🔹 token:", localStorage.getItem('token')); // null이어야 정상
    console.log("🔹 user_id:", localStorage.getItem('user_id')); // null이어야 정상

    // ✅ 50ms 후 새로고침 (캐싱 문제 방지)
    setTimeout(() => {
        location.reload();
    }, 50);
}

function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
// getRelativeTime 함수 내
const serverTimeOffset = -3 * 60; // 3분 차이 나는 경우 (초 단위)
const diff = ((now - date) / 1000) + serverTimeOffset;

  

  if (isNaN(diff)) return ""; // 🔥 날짜가 없을 경우 빈값 반환

  if (diff < 120) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return date.toLocaleDateString();
}








// ✅ 피드 삭제 기능
async function deleteFeed(feedId) {
    if (!confirm("이 피드를 삭제하시겠습니까?")) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    const res = await fetch(`${api}/delete-feed`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feed_id: feedId })
    });

    if (res.ok) {
        showToast("피드가 삭제되었습니다!"); // ✅ 성공한 경우에만 토스트
        loadFeeds('/my-feeds');  // ✅ 내 피드 다시 불러오기
    } else {
        const err = await res.json();
        alert("❌ 삭제 실패: " + err.error);
    }
}

// ✅ loadUserFeeds 정리
async function loadUserFeeds(userId, userName) {
  currentFeedEndpoint = `/user-feeds/${userId}`;
  currentUserName = userName;
  resetFeedState(currentFeedEndpoint); // 상태 초기화 및 feeds 영역 비우기
  
  page = 1;
  done = false;
  loading = false;

  const feedsDiv = document.getElementById('feeds');
  const titleEl = document.getElementById('feeds-title');

  feedsDiv.innerHTML = '';
  titleEl.innerText = `👤 ${userName}님의 피드`;
  await loadFeeds(currentFeedEndpoint); // 여기에서 DOM 업데이트 완료됨

  // 불필요한 feeds 참조 코드를 제거합니다.
  // setupVideoObservers 및 페이지 증가 작업만 남깁니다.
  setupVideoObservers();
  page++;  // 페이지 증가 (다음 무한스크롤 대비)
}




async function likeComment(commentId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  const res = await fetch(`${api}/like-comment`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment_id: commentId })
  });

  if (!res.ok) {
    const text = await res.text(); // 👈 문제의 HTML일 수도 있음
    console.error("❌ 서버 오류:", text);
    alert("댓글 좋아요 실패");
    return;
  }

  const data = await res.json(); // 👈 여기서 오류 발생한 것!
  console.log("✅ 좋아요 응답:", data);

  // ✅ 좋아요 버튼 업데이트
  const btn = document.querySelector(`#comment-${commentId} .like-comment-btn`);
  if (btn) {
    btn.classList.toggle('liked', data.liked);
    btn.innerText = `❤️ ${data.like_count}`;
  }
}






function showToast(msg) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#333';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = 9999;
  toast.style.opacity = 0;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.transition = 'opacity 0.3s'; toast.style.opacity = 1; }, 10);
  setTimeout(() => { toast.style.opacity = 0; setTimeout(() => toast.remove(), 300); }, 2000);
}


// ✅ 좋아요 버튼 업데이트
async function likeFeed(feedId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    try {
        console.log(`🚀 좋아요 요청 시작 (feedId=${feedId})`);

        const res = await fetch(`${api}/like`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feed_id: feedId })
        });

        if (!res.ok) {
            console.error(`🔥 좋아요 요청 실패: ${res.status}`);
            alert(`좋아요 요청 실패 (${res.status})`);
            return;
        }

        const data = await res.json();
        console.log("✅ 좋아요 응답 데이터:", data);

        // ✅ 좋아요 버튼 UI 업데이트
        const likeBtn = document.getElementById(`like-btn-${feedId}`);
        if (likeBtn) {
            likeBtn.classList.toggle("liked", data.liked);
            likeBtn.innerText = `❤️ ${data.like_count}`;
        }

    } catch (error) {
        console.error("🔥 좋아요 오류:", error);
        alert("좋아요 요청 중 오류 발생");
    }
}



// ✅ 댓글 불러오기
async function commentFeed(feedId, forceOpen = false) {
  const commentsDiv = document.getElementById(`comments-${feedId}`);

  // ✅ 토글 방지: forceOpen이 true일 경우 무조건 다시 렌더링
  if (!forceOpen && commentsDiv.innerHTML.trim() !== "") {
    commentsDiv.innerHTML = "";
    return;
  }

  const res = await fetch(`${api}/comments/${feedId}`);
  if (!res.ok) {
    commentsDiv.innerHTML = "<p>❌ 댓글을 불러올 수 없습니다.</p>";
    return;
  }

  const comments = await res.json();
  const userId = localStorage.getItem('user_id');
  let commentHTML = "";

  comments.forEach(comment => {

  const isDeleted = comment.deleted == 1;

  const liked = comment.liked; // 서버에서 같이 내려오게 하면 좋아요 상태 체크 가능
const likeCount = comment.like_count || 0;

commentLine = `
  <div class="comment ${comment.parent_id ? 'reply' : ''}" id="comment-${comment.id}">
    <div class="comment-left">
      <strong>${comment.name}</strong>:
      ${isDeleted ? '<em style="color:#999;">삭제된 댓글입니다.</em>' : comment.content}
      ${!isDeleted ? `<button class="reply-btn" onclick="toggleReplyInput(${comment.id}, ${feedId})">💬 답글</button>` : ""}
      ${!isDeleted ? `<button class="like-comment-btn ${liked ? 'liked' : ''}" onclick="likeComment(${comment.id})">❤️ ${likeCount}</button>` : ""}
    </div>
    ${!isDeleted && userId == comment.user_id ? `
      <div class="comment-right">
        <button class="delete-btn" onclick="deleteComment(${comment.id}, ${feedId})">❌</button>
      </div>` : ""}
  </div>
`;





commentLine += `
    </div>
  </div>
`;

  // ✅ 미디어 표시 (삭제된 댓글은 생략)
  if (!isDeleted && comment.media_url) {
    commentLine += `
      <div style="margin-left: 20px; margin-top: 5px;">
        ${comment.media_url.includes('.mp4')
          ? `<video controls src="${comment.media_url}" style="max-width: 300px;"></video>`
          : `<img src="${comment.media_url}" style="max-width: 300px;">`}
      </div>
    `;
  }

  // ✅ 대댓글 입력창 자리
  commentLine += `<div id="reply-container-${comment.id}" class="reply-container"></div>`;

  commentHTML += commentLine;
});


  // ✅ 메인 댓글 입력창 (파일첨부, 이모지 포함)
  commentHTML += `
  <div style="margin-top: 10px;">
    <div class="emoji-trigger-wrapper">
      <input type="text" id="comment-input-${feedId}" placeholder="댓글 입력...">
      <label for="comment-file-${feedId}" style="cursor: pointer;">📷</label>
      <input type="file" id="comment-file-${feedId}" accept="image/*,video/*" style="display: none;">
      <button class="emoji-icon" onclick="setupEmojiPicker('comment-input-${feedId}', this)">😊</button>
    </div>
    <div style="margin-top: 6px; text-align: right;">
      <button onclick="addComment(${feedId})" style="padding: 6px 12px; font-size: 0.9rem;">댓글 달기</button>
    </div>
    <div id="emoji-picker-comment-input-${feedId}" class="emoji-picker"></div>
    <div id="preview-${feedId}" style="margin-top: 5px;"></div>
  </div>
`;

  commentsDiv.innerHTML = commentHTML;
}



// ✅ 댓글삭제.
async function deleteComment(commentId, feedId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    if (!confirm("댓글을 삭제하시겠습니까?")) return; // 🔥 삭제 확인

    const res = await fetch(`${api}/delete-comment`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId })
    });

    if (res.ok) {
        console.log(`✅ 댓글 ${commentId} 삭제됨!`);

        // 🔥 삭제 후 댓글 다시 불러오기
        commentFeed(feedId, true);

        // 🔥 댓글 카운트 다시 가져오기
        updateCommentCount(feedId);
    } else {
        alert("❌ 댓글 삭제 실패!");
    }
}

 async function updateCommentCount(feedId) {
    try {
        const res = await fetch(`${api}/comments/${feedId}`);
        if (!res.ok) throw new Error("서버 응답 오류");

        const comments = await res.json();
        const newCommentCount = comments.length; // 🔥 현재 댓글 개수 확인

        // 🔥 댓글 개수 업데이트
        document.getElementById(`comment-count-${feedId}`).innerText = newCommentCount;
        console.log(`🔄 댓글 개수 업데이트됨: ${newCommentCount}`);

    } catch (error) {
        console.error("❌ 댓글 개수 업데이트 실패:", error);
    }
}








// ✅ 답글 입력창 토글 (대댓글 입력창을 클릭한 댓글 아래에 표시)
function toggleReplyInput(commentId, feedId) {
    const replyContainer = document.getElementById(`reply-container-${commentId}`);

    // ✅ 입력창이 이미 있으면 삭제 (토글 기능)
    if (replyContainer.innerHTML.trim() !== "") {
        replyContainer.innerHTML = "";
        return;
    }

    // ✅ 입력창을 기존 댓글 아래에 바로 삽입
    replyContainer.innerHTML = `
  <div class="reply-input" style="position: relative; display: flex; align-items: center; gap: 5px;">
    <input type="text" id="reply-input-field-${commentId}" placeholder="대댓글입력..." style="flex: 1;">
    <label for="reply-media-${commentId}" style="cursor: pointer;">📷</label>
    <input type="file" id="reply-media-${commentId}" accept="image/*,video/*" style="display: none;">
    <button onclick="setupEmojiPicker('reply-input-field-${commentId}', this)">😊</button>
    <button onclick="addComment(${feedId}, ${commentId})">대댓글 작성</button>
  </div>
  <div id="emoji-picker-reply-input-field-${commentId}" class="emoji-picker"></div>
  <div id="reply-preview-${commentId}" style="margin-left: 20px; margin-top: 5px;"></div>
`;



}

// ✅ 댓글 추가 후 카운트 업데이트
// ✅ 댓글 추가 API 요청
async function addComment(feedId, parentId = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  // ✅ parentId가 있는 경우 → 대댓글
  const inputId = parentId ? `reply-input-field-${parentId}` : `comment-input-${feedId}`;
  const fileInputId = parentId ? `reply-media-${parentId}` : `comment-file-${feedId}`;
  const previewId = parentId ? `reply-preview-${parentId}` : `preview-${feedId}`;

  const content = document.getElementById(inputId)?.value;
  const fileInput = document.getElementById(fileInputId);
  const file = fileInput?.files?.[0];

  if (!content && !file) {
  showToast("❗️내용또는 미디어 파일 넣어주세요.!");
  return;
}


  const formData = new FormData();
  formData.append('feed_id', feedId);
  if (parentId) formData.append('parent_id', parentId);
  formData.append('content', content);
  if (file) formData.append('media', file);

  const res = await fetch(`${api}/add-comment`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });

  if (res.ok) {
    const data = await res.json();

    // ✅ 입력창, 파일, 미리보기 초기화
    if (document.getElementById(inputId)) document.getElementById(inputId).value = '';
    if (fileInput) fileInput.value = '';
    if (document.getElementById(previewId)) document.getElementById(previewId).innerHTML = '';

    // ✅ 댓글 수 업데이트
    document.getElementById(`comment-count-${feedId}`).innerText = data.comment_count;
    commentFeed(feedId, true);
  } else {
    alert("댓글 업로드 실패");
  }
}


document.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let previewDiv;

    if (e.target.id.startsWith("comment-file-")) {
        const feedId = e.target.id.replace("comment-file-", "");
        previewDiv = document.getElementById(`preview-${feedId}`);
    } else if (e.target.id.startsWith("reply-media-")) {
        const commentId = e.target.id.replace("reply-media-", "");
        previewDiv = document.getElementById(`reply-preview-${commentId}`);
    }

    if (previewDiv) {
        previewDiv.innerHTML = "";
        const url = URL.createObjectURL(file);
        previewDiv.innerHTML = file.type.startsWith("video")
            ? `<video src="${url}" controls style="max-width: 300px;"></video>`
            : `<img src="${url}" style="max-width: 300px;">`;
    }
});







  // ✅ 대댓글 추가
async function replyTo(commentId, feedId) {
    const replyContent = prompt("답글을 입력하세요:");
    if (!replyContent) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    await fetch(`${api}/add-comment`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_id: feedId, content: replyContent, parent_id: commentId })
    });

    commentFeed(feedId, true);
}

async function setupVideoObservers() {
  const videos = document.querySelectorAll('.feed-video');

  if (window.videoObserver) window.videoObserver.disconnect();

  window.videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;

      if (entry.isIntersecting) {
        video.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error('⚠️ 비디오 재생 중 에러:', err);
          }
        });
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5 });

  videos.forEach(video => window.videoObserver.observe(video));
}
function resetFeedState(endpoint) {
  currentFeedEndpoint = endpoint;
  page = 1;
  done = false;
  loading = false;
  loadedFeedIds.clear();  // ✅ 반드시 초기화해야 중복 로딩 안 생김
  document.getElementById('feeds').innerHTML = '';
}






// ✅ 피드 로딩 완료 시 Observer 초기화
// ✅ 피드 로딩 완료 시 Observer 초기화
// ✅ 완성된 loadFeeds 함수 (전체 피드 / 내 피드 / 유저 피드 모두 동작)
async function loadFeeds(endpoint, pageArg = null) {
  const feedsDiv = document.getElementById('feeds');
  const titleEl = document.getElementById('feeds-title');

  // 이미 로딩 중이거나 모든 피드를 불러왔다면 중단
  if (loading || done) return;
  
  loading = true;

  const isNewEndpoint = currentFeedEndpoint !== endpoint;
  const pageToUse = pageArg !== null ? pageArg : page;  // ✅ 반드시 선언 필요!!

  if (isNewEndpoint) {
    currentFeedEndpoint = endpoint;
    page = 1;
    done = false;
    feedsDiv.innerHTML = '';
    loadedFeedIds.clear();
  }

  const headers = {};
  if (endpoint === '/my-feeds') {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      loading = false;
      return;
    }
    headers['Authorization'] = 'Bearer ' + token;
    titleEl.innerText = "👤 내 피드";
  } else if (endpoint === '/feeds') {
    titleEl.innerText = "📢 전체 피드";
  } else if (endpoint.startsWith('/user-feeds')) {
    titleEl.innerText = `👤 ${currentUserName}님의 피드`;
  }

  try {
    const res = await fetch(`${api}${endpoint}?page=${pageToUse}&limit=${limit}`, { headers });

    if (!res.ok) {
      alert('서버 오류: ' + res.status);
      loading = false;
      return;
    }

    const feeds = await res.json();

    if (feeds.length < limit) {
      done = true;
    }

    feeds.forEach(feed => {
      if (loadedFeedIds.has(feed.id)) return;
      loadedFeedIds.add(feed.id);

      const profileImage = feed.profile_image || "https://placehold.co/40x40";
      const likedClass = feed.liked ? "liked" : "";
      const likeCount = feed.like_count || 0;
      const commentCount = feed.comment_count || 0;
      const isMyFeed = localStorage.getItem('user_id') == feed.user_id;
      const timeAgo = getRelativeTime(feed.created_at);

      let mediaHTML = '';
      try {
        const mediaArray = JSON.parse(feed.media_url);
        if (Array.isArray(mediaArray) && mediaArray.length > 0) {
          const slides = mediaArray.map(url => {
            return `<div class="swiper-slide">
              ${url.includes('.mp4')
                ? `<video class="feed-video" controls muted preload="none" loading="lazy" src="${url}"></video>`
                : `<img src="${url}" loading="lazy">`}
            </div>`;
          }).join('');

          const swiperId = `swiper-${feed.id}`;
          mediaHTML = `
            <div class="swiper" id="${swiperId}">
              <div class="swiper-wrapper">${slides}</div>
              <div class="swiper-pagination"></div>
              <div class="swiper-button-prev"></div>
              <div class="swiper-button-next"></div>
            </div>`;

          setTimeout(() => {
            new Swiper(`#${swiperId}`, {
              loop: true,
              pagination: { el: `#${swiperId} .swiper-pagination` },
              navigation: {
                nextEl: `#${swiperId} .swiper-button-next`,
                prevEl: `#${swiperId} .swiper-button-prev`,
              },
            });
          }, 0);
        }
      } catch (e) {
        if (feed.media_url) {
          mediaHTML = feed.media_url.includes('.mp4')
            ? `<video class="feed-video" controls muted preload="none" loading="lazy" src="${feed.media_url}"></video>`
            : `<img src="${feed.media_url}" loading="lazy">`;
        }
      }

      feedsDiv.innerHTML += `<div class="feed">
        <div class="profile">
          <img src="${profileImage}">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <strong class="clickable-username" onclick="loadUserFeeds(${feed.user_id}, '${feed.name.replace(/'/g, "\\'")}')">${feed.name}</strong>
            <span class="timestamp" style="font-size: 0.85rem; color: #888;">${timeAgo}</span>
          </div>
        </div>
        <p>${feed.content || ''}</p>
        ${mediaHTML}
        <div class="actions">
          <button class="like-btn ${likedClass}" id="like-btn-${feed.id}" onclick="likeFeed(${feed.id})">❤️ ${likeCount}</button>
          <button id="comment-btn-${feed.id}" onclick="commentFeed(${feed.id})" class="icon-btn">
            <span>💬</span> <span id="comment-count-${feed.id}">${commentCount}</span>
          </button>
          ${isMyFeed ? `<button class="icon-btn" onclick="deleteFeed(${feed.id})">🗑️</button>` : ""}
        </div>
        <div id="comments-${feed.id}" class="comments"></div>
      </div>`;
    });

    await setupVideoObservers();

    page++;  // ✅ 페이지 증가
    
  } catch (error) {
    console.error('피드 로딩 중 오류:', error);
  } finally {
    loading = false;
  }
}
async function init() {
    console.log(`초기 페이지: ${page}`); // 정상적으로 초기값 출력
    await loadFeeds('/feeds'); // 피드 로드
}
document.addEventListener('DOMContentLoaded', () => {
    init(); // init 함수 호출
});

// 스크롤 이벤트 리스너 추가
function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    // 스크롤이 페이지 하단에 도달했는지 확인
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      // 현재 엔드포인트에 따라 다음 페이지 로드
      if (currentFeedEndpoint) {
        loadFeeds(currentFeedEndpoint);
      }
    }
  });
}

// 페이지 로드 시 무한 스크롤 설정
document.addEventListener('DOMContentLoaded', () => {
  setupInfiniteScroll();
  // 초기 피드 로드 (예: 전체 피드)
  loadFeeds('/feeds');
});





const emojiPickers = {};  // 피드별 이모지 팝업 관리

function setupEmojiPicker(inputId, buttonElement) {
  const input = document.getElementById(inputId);
  if (!input || !buttonElement) return;

  // 🔁 이전 picker가 있으면 제거
  if (emojiPickers[inputId]?.picker?.parentElement) {
    emojiPickers[inputId].hidePicker(); // 숨기기
    emojiPickers[inputId].picker.remove(); // DOM에서 제거
    delete emojiPickers[inputId]; // 객체 제거
  }

  // ✅ 새로 생성
  const picker = new EmojiButton();
  picker.on('emoji', emoji => {
    input.value += emoji;
    input.focus();
  });

  emojiPickers[inputId] = picker;
  picker.togglePicker(buttonElement);
}





window.addEventListener("DOMContentLoaded", () => {
  checkUser();
  // loadFeeds('/feeds');
});
