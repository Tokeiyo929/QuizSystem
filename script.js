class QuizSystem {
    constructor() {
        this.questions = JSON.parse(localStorage.getItem('quizQuestions')) || [];
        this.answerHistory = JSON.parse(localStorage.getItem('answerHistory')) || {};
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateQuestionsList();
        this.showSection('config');
    }

    bindEvents() {
        // 导航按钮事件
        document.getElementById('configBtn').addEventListener('click', () => {
            this.showSection('config');
        });

        document.getElementById('examBtn').addEventListener('click', () => {
            this.startExam();
        });

        document.getElementById('resultBtn').addEventListener('click', () => {
            this.showSection('result');
        });

        // 配置界面事件
        document.getElementById('addQuestionBtn').addEventListener('click', () => {
            this.addQuestion();
        });

        // 导入导出事件
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportQuestions();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importQuestions(e);
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllQuestions();
        });

        // 历史记录导入导出
        document.getElementById('exportHistoryBtn').addEventListener('click', () => {
            this.exportHistory();
        });

        document.getElementById('importHistoryFile').addEventListener('change', (e) => {
            this.importHistory(e);
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearAllHistory();
        });

        // 答题界面事件
        document.getElementById('submitAnswerBtn').addEventListener('click', () => {
            this.submitCurrentAnswer();
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousQuestion();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submitExam();
        });

        // 结果界面事件
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartExam();
        });

        // 答案输入事件
        document.getElementById('answerTextarea').addEventListener('input', () => {
            this.saveCurrentAnswer();
        });
    }

    showSection(sectionName) {
        // 隐藏所有section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // 重置导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 显示目标section和激活对应按钮
        document.getElementById(sectionName + 'Section').classList.add('active');
        
        if (sectionName === 'config') {
            document.getElementById('configBtn').classList.add('active');
        } else if (sectionName === 'exam') {
            document.getElementById('examBtn').classList.add('active');
        } else if (sectionName === 'result') {
            document.getElementById('resultBtn').classList.add('active');
        }
    }

    addQuestion() {
        const questionInput = document.getElementById('questionInput');
        const answerInput = document.getElementById('answerInput');
        
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();

        if (!question || !answer) {
            alert('请填写完整的题目和答案！');
            return;
        }

        this.questions.push({
            id: Date.now(),
            question: question,
            answer: answer
        });

        this.saveQuestions();
        this.updateQuestionsList();
        
        // 清空输入框
        questionInput.value = '';
        answerInput.value = '';
        
        alert('题目添加成功！');
    }

    updateQuestionsList() {
        const questionsList = document.getElementById('questionsList');
        const questionCount = document.getElementById('questionCount');
        
        questionCount.textContent = this.questions.length;
        
        if (this.questions.length === 0) {
            questionsList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无题目</p>';
            return;
        }

        questionsList.innerHTML = this.questions.map((q, index) => `
            <div class="question-item">
                <button class="delete-btn" onclick="quizSystem.deleteQuestion(${q.id})">删除</button>
                <h4>第${index + 1}题: ${q.question}</h4>
                <div class="answer">标准答案: ${q.answer}</div>
            </div>
        `).join('');
    }

    deleteQuestion(id) {
        if (confirm('确定要删除这道题目吗？')) {
            this.questions = this.questions.filter(q => q.id !== id);
            this.saveQuestions();
            this.updateQuestionsList();
        }
    }

    saveQuestions() {
        localStorage.setItem('quizQuestions', JSON.stringify(this.questions));
    }

    saveAnswerHistory() {
        localStorage.setItem('answerHistory', JSON.stringify(this.answerHistory));
    }

    exportQuestions() {
        if (this.questions.length === 0) {
            alert('没有题目可以导出！');
            return;
        }

        const dataStr = JSON.stringify(this.questions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `答题系统题目_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        alert(`成功导出 ${this.questions.length} 道题目！`);
    }

    importQuestions(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedQuestions = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedQuestions)) {
                    throw new Error('文件格式不正确');
                }

                // 验证题目格式
                const validQuestions = importedQuestions.filter(q => 
                    q && typeof q.question === 'string' && typeof q.answer === 'string'
                );

                if (validQuestions.length === 0) {
                    alert('导入的文件中没有有效的题目！');
                    return;
                }

                // 询问是否覆盖现有题目
                let shouldImport = true;
                if (this.questions.length > 0) {
                    shouldImport = confirm(
                        `当前已有 ${this.questions.length} 道题目，导入将覆盖现有题目。\n` +
                        `即将导入 ${validQuestions.length} 道题目，确定继续吗？`
                    );
                }

                if (shouldImport) {
                    // 重新生成ID
                    this.questions = validQuestions.map(q => ({
                        id: Date.now() + Math.random(),
                        question: q.question,
                        answer: q.answer
                    }));

                    this.saveQuestions();
                    this.updateQuestionsList();
                    alert(`成功导入 ${validQuestions.length} 道题目！`);
                }

            } catch (error) {
                alert('导入失败：文件格式不正确或文件损坏！');
                console.error('导入错误:', error);
            }
        };

        reader.readAsText(file);
        // 清空文件输入，允许重复导入同一文件
        event.target.value = '';
    }

    clearAllQuestions() {
        if (this.questions.length === 0) {
            alert('没有题目需要清空！');
            return;
        }

        if (confirm(`确定要清空所有 ${this.questions.length} 道题目吗？此操作不可恢复！`)) {
            this.questions = [];
            this.saveQuestions();
            this.updateQuestionsList();
            alert('所有题目已清空！');
        }
    }

    exportHistory() {
        const historyCount = Object.keys(this.answerHistory).length;
        if (historyCount === 0) {
            alert('没有答题记录可以导出！');
            return;
        }

        const dataStr = JSON.stringify(this.answerHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `答题记录_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        alert(`成功导出答题记录！`);
    }

    importHistory(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedHistory = JSON.parse(e.target.result);
                
                if (typeof importedHistory !== 'object' || importedHistory === null) {
                    throw new Error('文件格式不正确');
                }

                const currentHistoryCount = Object.keys(this.answerHistory).length;
                let shouldImport = true;
                
                if (currentHistoryCount > 0) {
                    shouldImport = confirm(
                        `当前已有答题记录，导入将合并到现有记录中。确定继续吗？`
                    );
                }

                if (shouldImport) {
                    // 合并历史记录
                    Object.keys(importedHistory).forEach(questionId => {
                        if (!this.answerHistory[questionId]) {
                            this.answerHistory[questionId] = [];
                        }
                        this.answerHistory[questionId] = this.answerHistory[questionId].concat(importedHistory[questionId]);
                    });

                    this.saveAnswerHistory();
                    alert('答题记录导入成功！');
                }

            } catch (error) {
                alert('导入失败：文件格式不正确或文件损坏！');
                console.error('导入错误:', error);
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    clearAllHistory() {
        const historyCount = Object.keys(this.answerHistory).length;
        if (historyCount === 0) {
            alert('没有答题记录需要清空！');
            return;
        }

        if (confirm('确定要清空所有答题记录吗？此操作不可恢复！')) {
            this.answerHistory = {};
            this.saveAnswerHistory();
            alert('所有答题记录已清空！');
        }
    }

    startExam() {
        if (this.questions.length === 0) {
            document.getElementById('examContent').style.display = 'none';
            document.getElementById('noQuestionsMsg').style.display = 'block';
            this.showSection('exam');
            return;
        }

        document.getElementById('examContent').style.display = 'block';
        document.getElementById('noQuestionsMsg').style.display = 'none';
        
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(this.questions.length).fill('');
        this.questionSubmitted = new Array(this.questions.length).fill(false);
        
        this.showSection('exam');
        this.displayCurrentQuestion();
        this.updateExamControls();
    }

    displayCurrentQuestion() {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        
        document.getElementById('currentQuestion').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        document.getElementById('currentQuestionText').textContent = currentQuestion.question;
        document.getElementById('answerTextarea').value = this.userAnswers[this.currentQuestionIndex] || '';
        
        // 检查当前题目是否已提交
        const isSubmitted = this.questionSubmitted[this.currentQuestionIndex];
        this.updateAnswerInterface(isSubmitted);
        
        if (isSubmitted) {
            this.showAnswerFeedback();
        }
    }

    updateAnswerInterface(isSubmitted) {
        const textarea = document.getElementById('answerTextarea');
        const submitBtn = document.getElementById('submitAnswerBtn');
        const feedback = document.getElementById('answerFeedback');
        
        if (isSubmitted) {
            textarea.disabled = true;
            submitBtn.style.display = 'none';
            feedback.style.display = 'block';
        } else {
            textarea.disabled = false;
            submitBtn.style.display = 'block';
            feedback.style.display = 'none';
        }
    }

    submitCurrentAnswer() {
        const answer = document.getElementById('answerTextarea').value.trim();
        
        // 保存答案
        this.userAnswers[this.currentQuestionIndex] = answer;
        this.questionSubmitted[this.currentQuestionIndex] = true;
        
        // 如果答案不为空，保存到历史记录
        if (answer) {
            this.saveAnswerToHistory(this.currentQuestionIndex, answer);
        }
        
        // 显示反馈
        this.showAnswerFeedback();
        this.updateAnswerInterface(true);
        this.updateExamControls();
    }

    saveAnswerToHistory(questionIndex, answer) {
        const question = this.questions[questionIndex];
        const questionId = question.id.toString();
        const timestamp = new Date().toLocaleString('zh-CN');
        
        if (!this.answerHistory[questionId]) {
            this.answerHistory[questionId] = [];
        }
        
        this.answerHistory[questionId].push({
            answer: answer,
            timestamp: timestamp
        });
        
        this.saveAnswerHistory();
    }

    showAnswerFeedback() {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex] || '未作答';
        const questionId = currentQuestion.id.toString();
        const history = this.answerHistory[questionId] || [];
        
        // 显示用户答案和标准答案
        document.getElementById('submittedAnswer').textContent = userAnswer;
        document.getElementById('standardAnswer').textContent = currentQuestion.answer;
        
        // 显示历史记录
        const historySection = document.getElementById('historySection');
        const historyList = document.getElementById('historyList');
        
        if (history.length > 0) {
            historySection.style.display = 'block';
            historyList.innerHTML = history.map(record => `
                <div class="history-item">
                    <div class="history-time">${record.timestamp}</div>
                    <div class="history-answer">${record.answer}</div>
                </div>
            `).join('');
        } else {
            historySection.style.display = 'none';
        }
    }

    updateExamControls() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        prevBtn.style.display = this.currentQuestionIndex > 0 ? 'block' : 'none';
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.style.display = 'none';
            // 检查是否所有题目都已提交
            const allSubmitted = this.questionSubmitted.every(submitted => submitted);
            submitBtn.style.display = allSubmitted ? 'block' : 'none';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    saveCurrentAnswer() {
        // 这个方法现在主要用于切换题目时保存草稿
        if (!this.questionSubmitted[this.currentQuestionIndex]) {
            const answer = document.getElementById('answerTextarea').value;
            this.userAnswers[this.currentQuestionIndex] = answer;
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveCurrentAnswer();
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
            this.updateExamControls();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.saveCurrentAnswer();
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
            this.updateExamControls();
        }
    }

    submitExam() {
        // 检查是否所有题目都已提交
        const unsubmittedCount = this.questionSubmitted.filter(submitted => !submitted).length;
        
        if (unsubmittedCount > 0) {
            alert(`还有${unsubmittedCount}道题目未提交答案，请先提交所有题目的答案！`);
            return;
        }

        this.showResults();
        document.getElementById('resultBtn').style.display = 'inline-block';
        this.showSection('result');
    }

    saveAnswersToHistory() {
        // 这个方法现在不需要了，因为答案在提交时就已经保存到历史记录
    }

    showResults() {
        const resultContent = document.getElementById('resultContent');
        
        let resultHTML = `
            <div class="result-summary">
                <h3>答题完成！</h3>
                <p>共${this.questions.length}道题目，你已全部作答</p>
            </div>
        `;

        resultHTML += this.questions.map((question, index) => {
            const questionId = question.id.toString();
            const history = this.answerHistory[questionId] || [];
            const currentAnswer = this.userAnswers[index] || '未作答';
            
            let historyHTML = '';
            if (history.length > 0) {
                historyHTML = `
                    <div class="answer-history">
                        <strong>历史答题记录 (${history.length}次):</strong>
                        <div class="history-list">
                            ${history.map((record, i) => `
                                <div class="history-item">
                                    <div class="history-time">${record.timestamp}</div>
                                    <div class="history-answer">${record.answer}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="result-item">
                    <h4>第${index + 1}题: ${question.question}</h4>
                    <div>
                        <strong>本次答案:</strong>
                        <div class="user-answer">${currentAnswer}</div>
                    </div>
                    <div>
                        <strong>标准答案:</strong>
                        <div class="standard-answer">${question.answer}</div>
                    </div>
                    ${historyHTML}
                </div>
            `;
        }).join('');

        resultContent.innerHTML = resultHTML;
    }

    restartExam() {
        if (confirm('确定要重新开始答题吗？当前进度将被清空。')) {
            this.startExam();
        }
    }
}

// 初始化系统
const quizSystem = new QuizSystem();