// ==========================================
// 機能ロジック: app.js
// (元の雛形ロジックを100%維持 + 科目階層を追加)
// ==========================================

// --- APP STATE ---
let currentSubject = null; // 選択中の科目データ
let currentQuiz = [];
let currentQuestionIndex = 0;
let userSelections = [];
let answeredQuestions = new Set();
let firstAttemptCorrect = new Set();
let userAnswersHistory = [];
let currentVersionKey = '';
let selectedVersionIndex = null;

// --- DOM ELEMENTS ---
const subjectScreen = document.getElementById('subject-screen');
const homeScreen = document.getElementById('home-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

const subjectList = document.getElementById('subject-list');
const versionSelection = document.getElementById('version-selection');
const subjectTitleDisplay = document.getElementById('subject-title-display');
const subjectDescriptionDisplay = document.getElementById('subject-description-display');
const backToSubjectBtn = document.getElementById('back-to-subject-btn');

const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const answerOptions = document.getElementById('answer-options');
const feedbackSection = document.getElementById('feedback-section');
const feedbackTitle = document.getElementById('feedback-title');
const explanationContent = document.getElementById('explanation-content');

const prevBtn = document.getElementById('prev-btn');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const resultsBtn = document.getElementById('results-btn');

const scoreText = document.getElementById('score-text');
const resultsSummary = document.getElementById('results-summary');
const homeBtnQuiz = document.getElementById('home-btn-quiz');
const homeBtnResults = document.getElementById('home-btn-results');

// モーダル関連
const startQuizModal = document.getElementById('start-quiz-modal');
const startModalText = document.getElementById('start-modal-text');
const viewPrevResultsBtn = document.getElementById('view-prev-results-btn');
const startNewQuizBtn = document.getElementById('start-new-quiz-btn');
const cancelStartModalBtn = document.getElementById('cancel-start-modal-btn');

const questionListBtn = document.getElementById('question-list-btn');
const questionListModal = document.getElementById('question-list-modal');
const closeQuestionListBtn = document.getElementById('close-question-list-btn');
const questionGrid = document.getElementById('question-grid');

const confirmHomeModal = document.getElementById('confirm-home-modal');
const cancelHomeBtn = document.getElementById('cancel-home-btn');
const confirmHomeBtn = document.getElementById('confirm-home-btn');

const alertModal = document.getElementById('alert-modal');
const alertModalText = document.getElementById('alert-modal-text');
const alertModalOkBtn = document.getElementById('alert-modal-ok-btn');

// --- EVENT LISTENERS ---

// 科目一覧からホーム（パターン一覧）へ戻る
backToSubjectBtn.addEventListener('click', showSubjectScreen);

// ホーム画面 (バージョン選択)
versionSelection.addEventListener('click', (e) => {
    const button = e.target.closest('.version-btn');
    if (button) {
        selectedVersionIndex = parseInt(button.dataset.version);
        
        if (!currentSubject.patterns[selectedVersionIndex] || !currentSubject.patterns[selectedVersionIndex].quizzes) {
            showAlertModal('このバージョンの問題データがありません。');
            return;
        }

        const versionKey = `version${selectedVersionIndex + 1}`;
        const scores = JSON.parse(localStorage.getItem(currentSubject.id)) || {};
        const result = scores[versionKey];

        // 機能1: 前回のデータがあるかチェック
        if (result && result.history) {
            startModalText.textContent = `パターン ${selectedVersionIndex + 1}: 前回の正答率は ${result.score} / ${result.total} でした。`;
            showModal(startQuizModal);
        } else {
            startQuiz(selectedVersionIndex);
        }
    }
});

// クイズ画面
homeBtnQuiz.addEventListener('click', () => {
    showModal(confirmHomeModal);
});
homeBtnResults.addEventListener('click', goHome);
prevBtn.addEventListener('click', () => navigateQuestion(-1));
nextBtn.addEventListener('click', () => navigateQuestion(1));
submitBtn.addEventListener('click', handleSubmit);
resultsBtn.addEventListener('click', () => showResults(false));

// モーダル関連イベント
viewPrevResultsBtn.addEventListener('click', viewPreviousResultsFromModal);
startNewQuizBtn.addEventListener('click', startNewQuizFromModal);
cancelStartModalBtn.addEventListener('click', () => hideModal(startQuizModal));
startQuizModal.addEventListener('click', (e) => {
    if (e.target === startQuizModal) hideModal(startQuizModal);
});

questionListBtn.addEventListener('click', showQuestionListModal);
closeQuestionListBtn.addEventListener('click', () => hideModal(questionListModal));
questionListModal.addEventListener('click', (e) => {
    if (e.target === questionListModal) hideModal(questionListModal);
});
questionGrid.addEventListener('click', (e) => {
    const button = e.target.closest('.question-grid-btn');
    if (button) {
        const index = parseInt(button.dataset.index);
        jumpToQuestion(index);
    }
});

confirmHomeBtn.addEventListener('click', () => {
    goHome();
});
cancelHomeBtn.addEventListener('click', () => hideModal(confirmHomeModal));
confirmHomeModal.addEventListener('click', (e) => {
    if (e.target === confirmHomeModal) hideModal(confirmHomeModal);
});

alertModalOkBtn.addEventListener('click', () => hideModal(alertModal));
alertModal.addEventListener('click', (e) => {
    if (e.target === alertModal) hideModal(alertModal);
});

// --- FUNCTIONS ---

// 1. 初期起動: 科目一覧を表示
function initApp() {
    if (!window.MOCK_SUBJECTS || window.MOCK_SUBJECTS.length === 0) {
        subjectList.innerHTML = '<p class="text-red-500 font-bold p-4 col-span-2 text-center">データファイルが読み込まれていません。</p>';
        return;
    }
    showSubjectScreen();
}

// 科目一覧画面の生成
function showSubjectScreen() {
    subjectScreen.classList.remove('hidden');
    homeScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');

    subjectList.innerHTML = '';
    window.MOCK_SUBJECTS.forEach((subject, index) => {
        const btn = document.createElement('button');
        btn.className = 'flex flex-col justify-center h-24 p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-transform hover:scale-105 text-center shadow-md';
        btn.innerHTML = `
            <span class="text-lg font-bold block mb-1">${subject.title}</span>
            <span class="text-xs opacity-90">${subject.description}</span>
        `;
        btn.onclick = () => selectSubject(index);
        subjectList.appendChild(btn);
    });
}

// 科目を選択し、パターン（バージョン）一覧を表示
function selectSubject(index) {
    currentSubject = window.MOCK_SUBJECTS[index];
    
    subjectScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    
    subjectTitleDisplay.textContent = currentSubject.title;
    subjectDescriptionDisplay.textContent = currentSubject.description;
    
    updateHomeScreen(); // 元のロジックでパターンボタンを生成
}


function showModal(modal) {
    modal.classList.add('visible');
}
function hideModal(modal) {
    modal.classList.remove('visible');
}
function showAlertModal(message) {
    alertModalText.textContent = message;
    showModal(alertModal);
}

function startNewQuizFromModal() {
    startQuiz(selectedVersionIndex);
    hideModal(startQuizModal);
}

function viewPreviousResultsFromModal() {
    const versionKey = `version${selectedVersionIndex + 1}`;
    const scores = JSON.parse(localStorage.getItem(currentSubject.id)) || {};
    const result = scores[versionKey];

    if (!result || !result.history) {
        showAlertModal('前回の結果データの読み込みに失敗しました。');
        hideModal(startQuizModal);
        return;
    }

    currentVersionKey = versionKey;
    currentQuiz = currentSubject.patterns[selectedVersionIndex].quizzes;
    currentQuestionIndex = 0;
    userSelections = Array(currentQuiz.length).fill(null);
    answeredQuestions = new Set(Array.from({ length: currentQuiz.length }, (_, i) => i));
    firstAttemptCorrect = new Set(result.correctSet);
    
    userAnswersHistory = result.history.map(item => ({
        incorrectSelections: new Set(item.incorrectSelections)
    }));

    homeScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    showResults(true);
    hideModal(startQuizModal);
}

function startQuiz(versionIndex) {
    currentVersionKey = `version${versionIndex + 1}`;
    currentQuiz = currentSubject.patterns[versionIndex].quizzes;
    
    currentQuestionIndex = 0;
    userSelections = Array(currentQuiz.length).fill(null);
    answeredQuestions = new Set();
    firstAttemptCorrect = new Set();
    userAnswersHistory = Array.from({ length: currentQuiz.length }, () => ({ incorrectSelections: new Set() }));
    
    homeScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    displayQuestion();
}

function displayQuestion() {
    feedbackSection.classList.add('hidden');
    
    const question = currentQuiz[currentQuestionIndex];
    questionCounter.innerHTML = `問題 ${currentQuestionIndex + 1} / ${currentQuiz.length}<br><span class="text-sm">提出済み: ${answeredQuestions.size}問</span>`;
    questionText.innerHTML = question.question;

    answerOptions.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'w-full text-left p-4 my-2 border rounded-lg transition-colors duration-200 bg-white hover:bg-gray-100 border-gray-300';
        if (userSelections[currentQuestionIndex] === index) {
            button.classList.add('btn-selected');
        }
        button.dataset.index = index;
        button.addEventListener('click', handleOptionSelect);
        answerOptions.appendChild(button);
    });

    updateNavigation();
    
    if (answeredQuestions.has(currentQuestionIndex)) {
        showFeedback();
    }

    if (questionListModal.classList.contains('visible')) {
        updateQuestionListModal();
    }
}

function handleOptionSelect(e) {
    if (answeredQuestions.has(currentQuestionIndex)) return;

    const selectedIndex = parseInt(e.target.dataset.index);
    userSelections[currentQuestionIndex] = selectedIndex;

    answerOptions.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('btn-selected');
    });
    e.target.classList.add('btn-selected');
    updateNavigation();
}

function handleSubmit() {
    const selectedIndex = userSelections[currentQuestionIndex];
    if (selectedIndex === null) {
        showAlertModal('回答を選択してください。');
        return;
    }

    const isFirstAttemptForThisQuestion = !userAnswersHistory[currentQuestionIndex].incorrectSelections.size > 0 && !answeredQuestions.has(currentQuestionIndex);

    const question = currentQuiz[currentQuestionIndex];
    const correctIndex = question.answer;

    if (selectedIndex === correctIndex) {
        if (isFirstAttemptForThisQuestion) {
            firstAttemptCorrect.add(currentQuestionIndex);
        }
        answeredQuestions.add(currentQuestionIndex);
        showFeedback();
        if (questionListModal.classList.contains('visible')) {
            updateQuestionListModal();
        }
    } else {
        userAnswersHistory[currentQuestionIndex].incorrectSelections.add(selectedIndex);
        const selectedButton = answerOptions.querySelector(`button[data-index='${selectedIndex}']`);
        selectedButton.className = 'w-full text-left p-4 my-2 border rounded-lg transition-colors duration-200 bg-red-100 border-red-400 text-red-800';
        selectedButton.disabled = true;
        userSelections[currentQuestionIndex] = null; 
    }
    
    updateNavigation();
    questionCounter.innerHTML = `問題 ${currentQuestionIndex + 1} / ${currentQuiz.length}<br><span class="text-sm">提出済み: ${answeredQuestions.size}問</span>`;
}

function showFeedback() {
    const question = currentQuiz[currentQuestionIndex];
    const incorrectSelections = userAnswersHistory[currentQuestionIndex].incorrectSelections;

    answerOptions.querySelectorAll('button').forEach((btn, index) => {
        btn.disabled = true;
        btn.classList.remove('btn-selected');
        if (index === question.answer) {
            btn.className = 'w-full text-left p-4 my-2 border rounded-lg transition-colors duration-200 bg-green-100 border-green-400 text-green-800';
        } else if (incorrectSelections.has(index)) {
            btn.className = 'w-full text-left p-4 my-2 border rounded-lg transition-colors duration-200 bg-red-100 border-red-400 text-red-800';
        } else {
            btn.className = 'w-full text-left p-4 my-2 border rounded-lg transition-colors duration-200 bg-white border-gray-300';
        }
    });
    
    feedbackTitle.textContent = "正解！";
    feedbackTitle.className = "text-xl font-bold mb-3 text-green-700";
    explanationContent.innerHTML = question.explanation;
    feedbackSection.classList.remove('hidden');
}

function updateNavigation() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === currentQuiz.length - 1;
    submitBtn.disabled = answeredQuestions.has(currentQuestionIndex) || userSelections[currentQuestionIndex] === null;
    resultsBtn.disabled = answeredQuestions.size !== currentQuiz.length;
}

function navigateQuestion(direction) {
    currentQuestionIndex += direction;
    displayQuestion();
}

function showQuestionListModal() {
    updateQuestionListModal();
    showModal(questionListModal);
}

function updateQuestionListModal() {
    questionGrid.innerHTML = '';
    for (let i = 0; i < currentQuiz.length; i++) {
        const button = document.createElement('button');
        button.textContent = i + 1;
        button.dataset.index = i;
        button.className = 'question-grid-btn';
        
        if (answeredQuestions.has(i)) {
            button.classList.add('answered');
        }
        if (i === currentQuestionIndex) {
            button.classList.add('current');
        }
        questionGrid.appendChild(button);
    }
}

function jumpToQuestion(index) {
    if (index >= 0 && index < currentQuiz.length) {
        currentQuestionIndex = index;
        displayQuestion();
        hideModal(questionListModal);
    }
}

function showResults(isViewingPrevious = false) {
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');

    const score = firstAttemptCorrect.size;
    const total = currentQuiz.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    scoreText.textContent = `正答率: ${score} / ${total} (${percentage}%)`;
    
    if (!isViewingPrevious) {
        const scores = JSON.parse(localStorage.getItem(currentSubject.id)) || {};
        const historyToSave = userAnswersHistory.map(item => ({
            incorrectSelections: Array.from(item.incorrectSelections)
        }));

        scores[currentVersionKey] = { 
            score: score, 
            total: total,
            history: historyToSave,
            correctSet: Array.from(firstAttemptCorrect)
        };
        localStorage.setItem(currentSubject.id, JSON.stringify(scores));
    }

    resultsSummary.innerHTML = '';
    currentQuiz.forEach((question, index) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('p-4', 'border', 'rounded-lg', 'bg-gray-50');
        
        let optionsHtml = '';
        const incorrectSelections = userAnswersHistory[index].incorrectSelections;

        question.options.forEach((option, optionIndex) => {
            let optionClass = 'text-gray-700';
            if (optionIndex === question.answer) {
                optionClass = 'font-bold text-green-600';
            } else if (incorrectSelections && incorrectSelections.has(optionIndex)) {
                optionClass = 'text-red-500 line-through';
            }
            optionsHtml += `<li class="${optionClass}">${option}</li>`;
        });

        resultItem.innerHTML = `
            <p class="font-semibold mb-2">問題 ${index + 1}: ${question.question}</p>
            <ul class="list-disc list-inside space-y-1">
                ${optionsHtml}
            </ul>
            <details class="mt-2 text-sm">
                <summary class="cursor-pointer text-gray-600 hover:text-black">解説を見る</summary>
                <div class="mt-2 p-3 bg-white rounded border border-gray-200">
                    ${question.explanation}
                </div>
            </details>
        `;
        resultsSummary.appendChild(resultItem);
    });
}

function goHome() {
    quizScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');

    hideModal(confirmHomeModal);
    hideModal(questionListModal);
    hideModal(startQuizModal);
    hideModal(alertModal);

    updateHomeScreen();
}

function updateHomeScreen() {
    const scores = JSON.parse(localStorage.getItem(currentSubject.id)) || {};
    const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-pink-500'];
    
    versionSelection.innerHTML = ''; // 一旦クリア

    currentSubject.patterns.forEach((patternObj, idx) => {
        const versionKey = `version${idx + 1}`;
        const result = scores[versionKey];
        
        let resultText = '<span class="text-sm font-normal mt-1 block">未挑戦</span>';
        if (result && typeof result.score !== 'undefined') {
            const percentage = Math.round((result.score / result.total) * 100);
            resultText = `<span class="text-sm font-normal mt-1 block font-bold text-yellow-200">前回正答率: ${percentage}%</span>`;
        }

        const btn = document.createElement('button');
        const colorClass = colors[idx % colors.length];
        
        btn.className = `version-btn flex flex-col items-center justify-center h-28 p-4 ${colorClass} text-white rounded-lg hover:brightness-110 transition-transform hover:scale-105 text-center shadow-sm`;
        btn.dataset.version = idx;
        btn.innerHTML = `
            <span class="text-lg font-bold">${patternObj.title}</span>
            <span class="text-xs mt-1 opacity-90 leading-tight">${patternObj.description}</span>
            ${resultText}
        `;
        
        versionSelection.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', initApp);