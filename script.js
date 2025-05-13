// API Key
const API_KEY = 'AIzaSyBAZb69xAZlQPn3cRrKHOQSv2gzwoDKhC4'; // Gemini API Key

// DOM元素
const startVoiceBtn = document.getElementById('startVoice');
const audioFileInput = document.getElementById('audioFile');
const statusDiv = document.getElementById('status');
const recognitionResultDiv = document.getElementById('recognitionResult');
const geminiResponseDiv = document.getElementById('geminiResponse');
const askGeminiBtn = document.getElementById('askGemini');

// 初始化Web Speech API
let recognition = null;
let isListening = false;
let recognizedText = '';

// 檢查瀏覽器是否支援Web Speech API
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    // 設定語音辨識參數
    recognition.lang = 'zh-TW'; // 設定為繁體中文
    recognition.continuous = true; // 持續聆聽
    recognition.interimResults = true; // 顯示中間結果
    
    // 語音辨識事件處理
    recognition.onstart = () => {
        statusDiv.textContent = '正在聆聽...';
        startVoiceBtn.classList.add('listening');
        isListening = true;
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
                recognizedText += transcript + ' ';
                
                // 更新UI
                recognitionResultDiv.textContent = recognizedText;
                askGeminiBtn.disabled = false; // 啟用Gemini按鈕
            } else {
                interimTranscript += transcript;
                // 顯示中間結果
                recognitionResultDiv.innerHTML = recognizedText + 
                    '<span style="color: #999;">' + interimTranscript + '</span>';
            }
        }
    };
    
    recognition.onerror = (event) => {
        statusDiv.textContent = `錯誤: ${event.error}`;
        statusDiv.classList.add('error');
        startVoiceBtn.classList.remove('listening');
        isListening = false;
    };
    
    recognition.onend = () => {
        if (isListening) {
            statusDiv.textContent = '語音辨識已結束';
            startVoiceBtn.classList.remove('listening');
            isListening = false;
        }
    };
} else {
    statusDiv.textContent = '您的瀏覽器不支援語音辨識功能';
    statusDiv.classList.add('error');
    startVoiceBtn.disabled = true;
}

// 按鈕事件處理
startVoiceBtn.addEventListener('click', () => {
    if (isListening) {
        // 停止聆聽
        recognition.stop();
        statusDiv.textContent = '語音辨識已停止';
        startVoiceBtn.textContent = '開始說話';
        startVoiceBtn.classList.remove('listening');
        isListening = false;
    } else {
        // 開始聆聽
        try {
            recognition.start();
            startVoiceBtn.textContent = '停止聆聽';
        } catch (error) {
            console.error('啟動語音辨識時發生錯誤:', error);
            statusDiv.textContent = `啟動語音辨識失敗: ${error.message}`;
            statusDiv.classList.add('error');
        }
    }
});

// 語音檔上傳處理
audioFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        statusDiv.textContent = `處理語音檔: ${file.name}`;
        
        // 使用HTML5的音訊API處理語音檔
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = function(e) {
            statusDiv.textContent = '正在解析音訊...';
            
            // 將檔案轉換為ArrayBuffer
            const arrayBuffer = e.target.result;
            
            // 解碼音訊
            audioContext.decodeAudioData(arrayBuffer)
                .then(audioBuffer => {
                    statusDiv.textContent = '音訊已解析，正在處理...';
                    
                    // 這裡無法直接使用Web Speech API處理檔案
                    // 在實際應用中，可以使用後端API或Whisper API來處理
                    // 這裡只是簡單顯示上傳成功的訊息
                    statusDiv.textContent = '檔案上傳成功！需要後端API處理或使用Whisper轉換';
                    statusDiv.classList.remove('error');
                    
                    // 實際應用中，這裡會呼叫後端API或Whisper API來處理
                    // 但在這個前端示範中，顯示提示訊息
                    recognitionResultDiv.textContent = 
                        '在完整實現中，這裡會顯示音訊檔的轉錄文字。' + 
                        '您需要將音訊檔傳送到後端API（如Whisper）進行處理。';
                    
                    // 啟用Gemini按鈕，以便後續操作
                    askGeminiBtn.disabled = false;
                })
                .catch(err => {
                    console.error('解析音訊檔案時發生錯誤:', err);
                    statusDiv.textContent = `無法處理音訊檔: ${err.message}`;
                    statusDiv.classList.add('error');
                });
        };
        
        fileReader.onerror = function(err) {
            statusDiv.textContent = `讀取檔案時發生錯誤: ${err.message}`;
            statusDiv.classList.add('error');
        };
        
        // 讀取檔案
        fileReader.readAsArrayBuffer(file);
    }
});

// Gemini API互動
askGeminiBtn.addEventListener('click', async () => {
    if (!recognizedText) {
        geminiResponseDiv.textContent = '請先說話或上傳語音檔！';
        return;
    }
    
    try {
        geminiResponseDiv.textContent = '正在向Gemini發送請求...';
        askGeminiBtn.disabled = true;
        
        // 呼叫Gemini API
        const response = await callGeminiAPI(recognizedText);
        geminiResponseDiv.textContent = response;
        askGeminiBtn.disabled = false;
    } catch (error) {
        console.error('呼叫Gemini API時發生錯誤:', error);
        geminiResponseDiv.textContent = `Gemini API錯誤: ${error.message}`;
        geminiResponseDiv.classList.add('error');
        askGeminiBtn.disabled = false;
    }
});

// 呼叫Gemini API的函數
async function callGeminiAPI(text) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    const payload = {
        contents: [{
            parts: [{
                text: text
            }]
        }]
    };
    
    try {
        const response = await fetch(`${url}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 解析Gemini API回應
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('無法從API回應中獲取文本內容');
        }
    } catch (error) {
        console.error('呼叫Gemini API時發生錯誤:', error);
        throw error;
    }
}